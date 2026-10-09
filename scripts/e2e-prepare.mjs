// Resets the embedded end-to-end database before the test server starts.
import { rmSync } from "node:fs";

rmSync(".data/e2e", { recursive: true, force: true });
rmSync(".data/uploads", { recursive: true, force: true });
