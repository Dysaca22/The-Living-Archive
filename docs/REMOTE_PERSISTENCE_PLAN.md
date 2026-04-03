# Remote Persistence Plan: The Living Archive (v1.1)

## 1. Comparison of Options

### Option A: Google Sheets + Apps Script (Direct Client-Side)
- **Description**: The frontend calls a Google Apps Script Web App URL directly.
- **Pros**: Zero server-side code in the project, easy to visualize data in a spreadsheet.
- **Cons**: **High Security Risk**. The Apps Script URL would be exposed in the frontend code. Anyone with the URL could potentially spam or delete the user's archive.
- **Effort**: Low.

### Option B: Server-Side Proxy (Express) + Google Sheets
- **Description**: The project is converted to a Full-Stack (Express + Vite) application. The frontend calls a local API endpoint (`/api/vault`), which then communicates with Google Sheets using a secret URL or Service Account stored in environment variables.
- **Pros**: **High Security**. Credentials never leave the server. Allows for request validation, rate limiting, and data transformation before reaching the remote storage.
- **Cons**: Requires maintaining a small Express server.
- **Effort**: Medium.

## 2. Recommendation: Option B (Server-Side Proxy)

**Decision**: We will implement **Option B**.

### Reasons:
1. **Security (P0)**: By using the project's full-stack runtime, we can hide the remote endpoint URL (Apps Script) from the browser. This prevents unauthorized access to the user's spreadsheet.
2. **Operational Simplicity**: The user only needs to provide one "Remote Archive URL" in their secrets. The app handles the rest.
3. **Decoupling**: The frontend doesn't need to know *how* the data is stored remotely (Sheets, SQL, or JSON file); it just talks to its own API.
4. **Future-Proof**: If we decide to move from Google Sheets to a real database (like Firestore) in v1.2, we only change the server-side logic; the frontend remains untouched.

## 3. Implementation Strategy

1. **Server Entry Point**: Create `server.ts` to handle both the Vite dev server and the API routes.
2. **Environment Variables**: Add `REMOTE_VAULT_URL` to `.env.example`.
3. **API Design**:
   - `GET /api/vault`: Fetches the remote archive.
   - `POST /api/vault`: Appends a new movie to the remote archive.
4. **Frontend Integration**: Create `RemotePersistenceService` to abstract the fetch/post calls.
5. **Sync Logic**: The `PlatformStateManager` will be updated to perform "Dual-Write": save to `localStorage` first (for speed/offline) and then attempt to sync to the remote vault.
