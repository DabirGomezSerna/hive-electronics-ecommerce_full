import dotenv from "dotenv";
import connectDB from "./src/config/db.conf.js";
import createApp from "./src/app.js";

dotenv.config();

const app = createApp();
const PORT = process.env.PORT || 3000;

connectDB();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
