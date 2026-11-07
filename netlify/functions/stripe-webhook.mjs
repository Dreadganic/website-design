/* stripe-webhook: the handler in netlify/lib/handlers, in the function format Netlify Blobs needs (see netlify/lib/v2.js). It used Lambda
   compatibility mode until 7 November 2026, where Blobs can't do strong reads, so the game parts of the payment flow failed silently */
import * as blobs from "@netlify/blobs";
import handler from "../lib/handlers/stripe-webhook.js";
import { v2 } from "../lib/v2.js";
export default v2(handler, blobs);
