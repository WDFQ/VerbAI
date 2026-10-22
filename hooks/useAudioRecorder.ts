import { useRef } from "react";

/**
 * Microphone recording hook, used by app/page.tsx.
 *
 * Usage:
 *   const recorder = useAudioRecorder();
 *   await recorder.start();          // asks for mic permission, begins recording
 *   const blob = await recorder.stop();  // ends recording, resolves with the audio file
 *   const base64 = await blobToBase64(blob);  // ready to send to /api/stt
 *
 * start() throws on a denied permission, a missing mic, or an unsupported format.
 * The caller (handleMicTap in page.tsx) turns those errors into alerts.
 */

// The recording format. It must match the encoding the STT route tells Google to expect
// (WEBM_OPUS in app/api/stt/route.ts). Change both together or transcription will fail.
// Chrome records this format, and it was tested working on iPad Safari; browsers that
// don't support it fail in start() below, before anything is recorded.
const MIME_TYPE = "audio/webm;codecs=opus";

export function useAudioRecorder() {
    const mediaRecorderRef = useRef<MediaRecorder | null>(null); // The active recorder instance
    const chunksRef = useRef<Blob[]>([]); // Audio pieces collected while recording
    const streamRef = useRef<MediaStream | null>(null); // The live mic stream, kept so we can release it later

    const start = async () => {
        // Ignore a second start() call while a recording is already in progress, so
        // the mic stream isn't overwritten and left open
        if (mediaRecorderRef.current) return;
        
        // Return if this browser can't record in the format the STT API requires
        if (!MediaRecorder.isTypeSupported(MIME_TYPE)) {
            throw new Error("This browser doesn't support the required audio format.");
        }

        // Asks the browser for mic permission; throws if denied/unavailable
        // channelCount: 1 forces mono, matching what the Speech-to-Text API expects by default
        // (browsers treat this as a request, not a guarantee)
        // NOTE: browsers only allow mic access on HTTPS or localhost, so this fails
        // when the app is opened over plain http://<ip>:3000 from another device.
        const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1 } });

        streamRef.current = stream;
        chunksRef.current = []; // Reset in case a previous recording left leftovers

        // Wraps the mic stream so we can capture it into chunks of audio data
        const recorder = new MediaRecorder(stream, { mimeType: MIME_TYPE });

        // Fires periodically (and on stop) with a chunk of recorded audio
        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        mediaRecorderRef.current = recorder;
        recorder.start(); // Begin capturing mic audio into chunksRef
    };

    const stop = (): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const recorder = mediaRecorderRef.current;
            if (!recorder || recorder.state === "inactive") {
                reject(new Error("No active recording to stop."));
                return;
            }

            // Runs once the recorder has fully stopped and the last chunk has been collected
            recorder.onstop = () => {
                // Stitch every collected chunk into one playable/uploadable audio file
                const blob = new Blob(chunksRef.current, { type: "audio/webm" });

                // Release the mic (stops the browser's "recording" indicator) and clear state
                streamRef.current?.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
                mediaRecorderRef.current = null;

                resolve(blob);
            };

            recorder.stop(); // Triggers the onstop handler above once it finishes
        });
    };

    // TODO: there is no maximum recording length. Google's synchronous recognize endpoint
    // only accepts short clips (about a minute), and Vercel limits request bodies
    // (about 4.5 MB), so a very long recording will fail at /api/stt. Consider stopping automatically.
    // TODO: nothing releases the mic if the component unmounts mid-recording (for example,
    // navigating to History while recording). Add a cleanup effect that stops the stream.
    return { start, stop };
}

// Converts recorded audio into base64 text, since JSON (used to call /api/stt) can't carry raw binary
export function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        // FileReader is the browser API for reading Blob/File contents asynchronously
        const reader = new FileReader();

        reader.onloadend = () => {
            // readAsDataURL produces a string like "data:audio/webm;base64,GkXfo59Ch..."
            const result = reader.result as string;
            // Strip everything before the comma, keeping just the base64 payload
            resolve(result.split(",")[1]);
        };

        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
    });
}
