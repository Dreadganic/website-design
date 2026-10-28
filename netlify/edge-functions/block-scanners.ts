import type { Config } from '@netlify/edge-functions'

// Bots sweep every site for leaked secrets files and WordPress/Vite/Spring weak spots.
// None of these exist here, so answer with a cheap 403 instead of the 404 page.
// Only the paths below invoke this function; real pages never touch it.
export default async () =>
  new Response('Forbidden', {
    status: 403,
    headers: { 'content-type': 'text/plain', 'cache-control': 'public, max-age=86400' },
  })

export const config: Config = {
  path: [
    // secrets files and source-control folders
    '/.env*',
    '/*/.env*',
    '/.git*',
    '/*/.git*',
    '/.aws/*',
    '/.ssh/*',
    '/.vscode/*',
    '/.DS_Store',
    // PHP and WordPress
    '/*.php',
    '/*.php7',
    '/wp-admin*',
    '/*/wp-admin*',
    '/wp-includes/*',
    '/*/wp-includes/*',
    '/wp-content/*',
    '/*/wp-content/*',
    '/*/wlwmanifest.xml',
    // Vite dev-server and Spring Boot debug probes
    '/@fs/*',
    '/__vite*',
    '/actuator*',
    '/*/actuator*',
    // backup / dump files
    '/*.bak',
    '/*.old',
    '/*.save',
    '/*.backup',
    '/*.sql',
    '/*.swp',
  ],
}
