/* game-link: the handler in netlify/lib/handlers, in the function format Netlify Blobs needs (see netlify/lib/v2.js) */
import handler from "../lib/handlers/game-link.js";
import { v2 } from "../lib/v2.js";
export default v2(handler);
