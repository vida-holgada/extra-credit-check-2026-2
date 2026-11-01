import { createRoot } from "react-dom/client";
import Home from "../app/page";
import { staticRequest } from "../lib/static-request.mjs";
import "../app/globals.css";

createRoot(document.getElementById("root")!).render(<Home request={staticRequest} />);
