/* Turns away vulnerability scanners and scraper bots before they reach the site, with a tiny empty reply
   instead of the 404 page or a full page. The paths come from the site's 404 log: nobody uses them on Beju,
   they are probes for WordPress, PHP, leaked .env/git/cloud keys and admin panels of other apps.
   If a real page is ever added under one of these names (for example /api or /login), remove it from APP_ROUTES. */

// Probes for files and software Beju doesn't have
const SCANS = [
  /^\/\//,                                       // //xmlrpc.php, //wp/wp-includes/...
  /\/\.(?!well-known\/)/,                        // dotfiles anywhere: .env, .git, .aws, .ssh, .vscode, .DS_Store...
  /\.(php\d?|phtml|aspx?|axd|jsp|cgi|action|env|sql|bak|backup|old|save|swp|log|ini|pem|key|crt|tfstate|tfvars|hcl|ya?ml|toml|cfg|conf|config|dist|properties|py|rb|sh|ts|md|map|json|gz|zip|tar)$/i,
  /(^|\/)env([._-][\w.-]*)?$/i,                  // /env, /env.js, /env-config.js
  /wp-|wordpress|xmlrpc|wlwmanifest|phpinfo|joomla|drupal|magento|prestashop|laravel|symfony|codeigniter/i,
  /@fs\/|@vite|proc\/self|\/etc\/|\.\.|%2e|%2f|%5c|::\$data|meta-inf|;\//i,  // path traversal and dev-server leaks
  /credential|secret|service-?account|private-?key|terraform|docker|kubernetes|firebase|gcloud|htpasswd|id_(rsa|dsa|ecdsa|ed25519)/i,
];

// Admin panels and API routes of other apps; Beju's own API lives under /.netlify/functions/
const APP_ROUTES = /^\/(admin|administrator|login|signin|sign-in|signup|register|auth|account|users?|dashboard|panel|cpanel|console|portal|backoffice|manage|management|api|graphql|v[1-3]|actuator|swagger|api-docs|telescope|horizon|nova|filament|sidekiq|_profiler|_ignition|_next|_astro|_image|_environment|___proxy_subdomain_\w+|ecp|owa|webroot|cgi-bin|vendor|node_modules|server-status|server-info|debug|phpmyadmin|webmail|cms|crm|erp|wp|uploads|userfiles|storage|logs?|config|settings|secure|secrets|keys|tokens|internal|billing|team|members|workspace|organization|integrations|webhooks|agents?|prompts|mcp|sse|deployments|pipelines|forgot-password|reset-password|app|apps|api-keys|apikey|chat|docs|studio|playground|onboarding|analytics|models|flows|databases|environments|incidents|actions|builds|buckets|clusters|projects|releases|ci|monitoring|alerts|org|infrastructure|security|rest|oauth|s3|aws|elmah|backend|server|src|staging|prod|backup|old|__\w+|_vti_bin|_layouts)(\/|$)/i;

// AI training crawlers, SEO scrapers and hacking tools. Search engines, link previews (Facebook, LINE, Slack...)
// and AI assistants fetching a page for a person (ChatGPT-User, Claude-User, OAI-SearchBot...) are still let in.
const BOTS = /GPTBot|ClaudeBot|anthropic-ai|Claude-Web|CCBot|Bytespider|meta-externalagent|FacebookBot|Amazonbot|cohere-ai|cohere-training|Diffbot|ImagesiftBot|omgili|Timpibot|AI2Bot|Ai2Bot-Dolma|img2dataset|PanguBot|Kangaroo Bot|Webzio|PetalBot|AhrefsBot|SemrushBot|MJ12bot|DotBot|DataForSeoBot|BLEXBot|serpstatbot|Barkrowler|MegaIndex|Scrapy|python-requests|python-urllib|python-httpx|aiohttp|Go-http-client|libwww-perl|zgrab|masscan|nuclei|sqlmap|nikto|Nmap|WPScan|gobuster|feroxbuster|Fuzz Faster|CensysInspect|Expanse|l9explore|l9tcpid/i;

export const isBlocked = (path, ua) => !ua || BOTS.test(ua) || APP_ROUTES.test(path) || SCANS.some(re => re.test(path));

export default async (request) => {
  const { pathname } = new URL(request.url);
  if (isBlocked(pathname, request.headers.get("user-agent") || "")) {
    return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  }
};

export const config = {
  path: "/*",
  excludedPath: ["/.netlify/*"],
  onError: "bypass",
};
