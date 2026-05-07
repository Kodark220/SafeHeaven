# 🚀 Deployment Guide: Arc Verified Escrow

This document outlines the steps to deploy the Arc platform to production.

## 1. Backend (Render)

The backend is configured to run on [Render](https://render.com) using the `render.yaml` blueprint.

### **Steps:**
1.  Connect your GitHub repository to Render.
2.  Render will automatically detect the `render.yaml` file.
3.  In the Render Dashboard, go to **Blueprints** and create a new one.
4.  You will be prompted to provide the following **Environment Variables**:
    *   `ARC_RELAYER_PRIVATE_KEY`: Your private key for the Arc network.
    *   `GENLAYER_PRIVATE_KEY`: Your private key for GenLayer Bradbury.
    *   `ARC_ESCROW_CONTRACT_ADDRESS`: The address of your deployed Arc Escrow contract.
    *   `GENLAYER_VERIFIER_CONTRACT_ADDRESS`: The address of your deployed GenLayer Verifier contract.
    *   `CORS_ORIGIN`: Set this to your Vercel URL (e.g., `https://arc-escrow.vercel.app`).

### **Build Settings (Handled by render.yaml):**
*   **Build Command**: `npm install && npx prisma generate && npm run build`
*   **Start Command**: `node dist/server.js`

---

## 2. Frontend (Vercel)

The frontend is a Next.js application ready for [Vercel](https://vercel.com).

### **Steps:**
1.  Connect your GitHub repository to Vercel.
2.  Select the `frontend` directory as the **Root Directory**.
3.  Add the following **Environment Variable**:
    *   `NEXT_PUBLIC_API_URL`: Your Render backend URL (e.g., `https://arc-backend.onrender.com`).
4.  Deploy!

---

## 3. Database (Managed PostgreSQL)

The `render.yaml` blueprint automatically provisions a managed PostgreSQL database. 
*   Prisma will automatically migrate the schema during the build process using `npx prisma generate`.
*   The `DATABASE_URL` is automatically linked between the DB and the Web Service.

## 4. Post-Deployment Verification

Once both services are up:
1.  Visit your Vercel URL.
2.  Check the "Network Status" in the dashboard to ensure it's talking to the Render backend.
3.  Perform a test "Protocol Deployment" to verify the end-to-end flow.
