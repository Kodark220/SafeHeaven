import app from "./app.js";
import { ensureSeedData, prisma } from "./db.js";

const port = Number(process.env.PORT ?? 4000);

async function startServer() {
  await prisma.$connect();
  await ensureSeedData();

  app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start API", error);
  process.exit(1);
});
