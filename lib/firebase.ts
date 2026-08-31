// lib/firebaseAdmin.ts
import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getFirestore, Firestore } from 'firebase-admin/firestore'

/**
 * validates the crendeitals from env, initialises and establishes connection with firebase
 * @returns the firebase app obj
 */
function getFirebaseApp(): App {
    // Prevents "default app already exists" errors on hot reload / serverless re-invocation
    if (getApps().length > 0) {
        return getApps()[0]
    }

    const projectId = process.env.FIREBASE_PROJECT_ID
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

    if (!projectId || !clientEmail || !privateKey) {
        throw new Error('Missing Firebase Admin credentials — check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY env vars')
    }

    return initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
    })
}

const app = getFirebaseApp()
export const db: Firestore = getFirestore(app)
