#!/usr/bin/env bash
# Netlify's ignore command for production builds (netlify.toml, [context.production]): exit 0 skips the build, exit 1 builds.
# A production deploy costs 15 credits, so a push to main publishes only when one of its commit messages says [deploy]
# (any case; a pull request's title counts, since GitHub puts it in the merge commit). Deploy Previews and branch deploys
# are free and keep netlify.toml's usual rule. Ways to publish without a new commit: a Netlify build hook (Netlify builds
# those whatever this says), or "Clear cache and deploy site" in the Netlify UI (a build with no cache always goes ahead).
# Anything unexpected, such as git not finding the commit, builds: a wasted deploy costs less than a site that never updates.

marker="[deploy]"
say() { echo "Deploy gate: $*"; }

if [ -n "${INCOMING_HOOK_TITLE:-}" ]; then say "build hook \"$INCOMING_HOOK_TITLE\": publishing"; exit 1; fi
if [ -z "${COMMIT_REF:-}" ] || ! git cat-file -e "${COMMIT_REF}^{commit}" 2>/dev/null; then say "can't read the commit being built: publishing to be safe"; exit 1; fi
if [ -z "${CACHED_COMMIT_REF:-}" ] || [ "$CACHED_COMMIT_REF" = "$COMMIT_REF" ]; then say "no build cache (first build, or Clear cache and deploy): publishing"; exit 1; fi

messages="$(git log -1 --format=%B "$COMMIT_REF")"
if git cat-file -e "${CACHED_COMMIT_REF}^{commit}" 2>/dev/null; then
  messages="$messages
$(git log --format=%B "$CACHED_COMMIT_REF..$COMMIT_REF" 2>/dev/null)"   # every commit since the last build, not just the newest
fi

if printf '%s\n' "$messages" | grep -qiF -- "$marker"; then say "$marker found: publishing ${COMMIT_REF:0:7}"; exit 1; fi
say "no $marker in this push's commit messages: not publishing ${COMMIT_REF:0:7} (Deploy Previews and branch deploys are unaffected)"
exit 0
