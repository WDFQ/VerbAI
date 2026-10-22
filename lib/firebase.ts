import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getFirestore, Firestore } from 'firebase-admin/firestore'

/**
 * Firebase Admin setup. Exports `db`, the Firestore connection used by the sessions API routes.
 *
 * This is the server-side Admin SDK, so it only runs in API routes and never in the browser.
 * It authenticates with a service account and BYPASSES Firestore security rules, which means
 * all access control has to be done in the API routes themselves (currently there is none).
 *
 * Environment variables (from a service account key generated in the Firebase console:
 * Project settings > Service accounts > Generate new private key):
 *   FIREBASE_PROJECT_ID     the "project_id" field of the key file
 *   FIREBASE_CLIENT_EMAIL   the "client_email" field
 *   FIREBASE_PRIVATE_KEY    the "private_key" field, wrapped in double quotes, with the \n
 *                           characters left as text (they're converted to real newlines below)
 *
 * NOTE: never commit these values or the key file to Git. The private key gives full
 * read/write access to the database. Whoever takes over this project should generate a new
 * key and delete the old one.
 *
 * NOTE: if any variable is missing, this file throws when it is first loaded, so every route
 * that imports `db` fails before its own code runs, and the client gets Next.js's HTML error
 * page instead of JSON (which shows up in the browser as "Unexpected token '<'").
 * Check the server log for "Missing Firebase Admin credentials".
 */

/**
 * Validates the credentials from env, initialises and establishes connection with firebase
 * @returns the firebase app obj
 */
function getFirebaseApp(): App {
    // Prevents "default app already exists" errors on hot reload / serverless re-invocation
    if (getApps().length > 0) {
        return getApps()[0]
    }

    const projectId = process.env.FIREBASE_PROJECT_ID
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
    // Env files and hosting dashboards store the key's line breaks as the two characters "\n",
    // so convert them back into real newlines or the key is rejected as invalid
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
