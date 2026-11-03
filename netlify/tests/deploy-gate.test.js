/* The production deploy gate (netlify/deploy-gate.sh, Netlify's ignore command for main): it builds (exit 1) only when the push
   asks for it with [deploy], or for a build hook or a build with no cache, and skips (exit 0) everything else. Runs the real
   script against a throwaway git repository. */
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs"), os = require("os"), path = require("path");
const { execFileSync, spawnSync } = require("child_process");

const GATE = path.join(__dirname, "../deploy-gate.sh");
let dir;
const git = (...args) => execFileSync("git", ["-c", "user.name=Test", "-c", "user.email=test@example.com", "-c", "commit.gpgsign=false", ...args], { cwd: dir, encoding: "utf8" }).trim();
const commit = (msg) => { fs.appendFileSync(path.join(dir, "f.txt"), msg + "\n"); git("add", "f.txt"); git("commit", "-q", "-m", msg); return git("rev-parse", "HEAD"); };
const gate = (env) => spawnSync("bash", [GATE], { cwd: dir, encoding: "utf8", env: Object.assign({ PATH: process.env.PATH, HOME: process.env.HOME }, env) });

test.beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), "deploy-gate-")); git("init", "-q", "-b", "main"); });
test.afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

test("deploy gate: a push with no [deploy] doesn't publish; one with it does, in any case", () => {
  const last = commit("Kona: rework the boat");
  const head = commit("Tidy the tests");
  const skip = gate({ CACHED_COMMIT_REF: last, COMMIT_REF: head });
  assert.equal(skip.status, 0, skip.stdout); assert.match(skip.stdout, /not publishing/);
  const go = commit("Ship the island fixes [Deploy]");
  assert.equal(gate({ CACHED_COMMIT_REF: last, COMMIT_REF: go }).status, 1);
});

test("deploy gate: [deploy] anywhere in the push counts, not just the newest commit, and in a merge commit's body", () => {
  const last = commit("Before");
  commit("Blue Mountain balance [deploy]");
  const head = commit("A follow-up typo fix");
  assert.equal(gate({ CACHED_COMMIT_REF: last, COMMIT_REF: head }).status, 1, "an earlier commit in the push asked");
  const base = commit("Main moves on");
  git("checkout", "-q", "-b", "feature"); commit("Work on a branch");
  git("checkout", "-q", "main"); git("merge", "-q", "--no-ff", "feature", "-m", "Merge pull request #18 from Dreadganic/feature\n\nCounter fixes [deploy]");
  assert.equal(gate({ CACHED_COMMIT_REF: base, COMMIT_REF: git("rev-parse", "HEAD") }).status, 1, "a pull request's title in the merge commit");
});

test("deploy gate: a [deploy] already published doesn't publish the next push again", () => {
  commit("First");
  const deployed = commit("Release [deploy]");
  const head = commit("Small change after the release");
  assert.equal(gate({ CACHED_COMMIT_REF: deployed, COMMIT_REF: head }).status, 0);
});

test("deploy gate: build hooks and builds with no cache publish; an unreadable commit publishes to be safe", () => {
  const a = commit("One"), b = commit("Two");
  assert.equal(gate({ CACHED_COMMIT_REF: a, COMMIT_REF: b, INCOMING_HOOK_TITLE: "Publish now" }).status, 1, "a build hook");
  assert.equal(gate({ CACHED_COMMIT_REF: b, COMMIT_REF: b }).status, 1, "Clear cache and deploy: the cached ref is the commit itself");
  assert.equal(gate({ COMMIT_REF: b }).status, 1, "the first build ever has no cached ref");
  assert.equal(gate({ CACHED_COMMIT_REF: a, COMMIT_REF: "0000000000000000000000000000000000000000" }).status, 1, "git can't find the commit");
});

test("deploy gate: if the last build's commit isn't in the clone, the newest commit's message decides", () => {
  const head = commit("Just a fix"), missing = "1111111111111111111111111111111111111111";
  assert.equal(gate({ CACHED_COMMIT_REF: missing, COMMIT_REF: head }).status, 0);
  const go = commit("Publish this [deploy]");
  assert.equal(gate({ CACHED_COMMIT_REF: missing, COMMIT_REF: go }).status, 1);
});
