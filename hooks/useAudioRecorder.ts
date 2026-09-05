import { useRef } from "react";

const MIME_TYPE = "audio/webm;codecs=opus";

export function useAudioRecorder() {
    const mediaRecorderRef = useRef<MediaRecorder | null>(null); // The active recorder instance
    const chunksRef = useRef<Blob[]>([]); // Audio pieces collected while recording
    const streamRef = useRef<MediaStream | null>(null); // The live mic stream, kept so we can release it later

    const start = async () => {
        // Return if this browser can't record in the format the STT API requires
        if (!MediaRecorder.isTypeSupported(MIME_TYPE)) {
            throw new Error("This browser doesn't support the required audio format.");
        }

        // Asks the browser for mic permission; throws if denied/unavailable
        // channelCount: 1 forces mono, matching what the Speech-to-Text API expects by default
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
