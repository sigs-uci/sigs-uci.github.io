# Releasing the website

Pushing source to `main` and publishing the website are separate actions. Validation runs locally. There is no GitHub workflow for checks on pushes or pull requests.

The release workflow accepts a typed publication confirmation and requires the repository variable `PAGES_DEPLOY_ENABLED` to equal the literal string `true`. It also requires the `sigs-uci/sigs-uci.github.io` repository and `refs/heads/main`. Keep the variable unset or `false` between authorized releases.

Keep the Pages build source set to GitHub Actions. Branch publishing can publish a main push independently of the manual release gate. Inspect the actual Pages source before changing the release setup.

## Before release

Confirm the selected main commit, approved public content, media rights, contact route and locale review. Run `npm ci`, `npm run check`, `npm test`, `npm run build`, `npm run links` and `npm run output:check` locally, then inspect the built preview. Keep a record of the reviewed commit and actual test results. Check that the organization mailbox has an owner and that missing optional content has a truthful public state.

When publication is authorized, enable the repository variable and manually run **Release website** from the reviewed main commit, with **confirm_publication** checked. The workflow checks out that exact workflow SHA, installs from the lockfile and builds the site and search before uploading only `dist/`. It does not repeat the local validation suite on GitHub.

The separate deployment job receives Pages and OIDC write permissions and uses the `github-pages` environment. It deploys the artifact from that successful run. No production secret is required in the build job. Action versions are pinned to immutable commits; review their official releases before updating the pins.

After a successful deployment, check the public root, English and Persian homepages, an event deep link in both languages, the team pages, search, keyboard navigation and `/404.html`. Check that the language switch preserves the page. Record the live URL and deployed SHA, then return `PAGES_DEPLOY_ENABLED` to `false`. A successful upload or skipped deployment is not proof that a site is live.

## Correct or recover

For a content or code problem, make a new corrective commit on `main`, run all checks and release it through the same gate. Do not force-push or rewrite history. If an urgent release needs an older version, an organization owner should choose the recovery action in Pages after inspecting the actual incident and permissions.

If a local check fails, correct that cause before publishing. If the manual build fails, its artifact is not deployed. If a push or release is rejected by repository protections, retain the work and resolve access with an organization owner. Do not change protections or switch identities to bypass the rejection.

The organization profile is maintained in the separate `.github` repository. Updating it publishes GitHub profile content and does not deploy this website.
