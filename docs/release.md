# Releasing the website

Pushing source to `main` and publishing the website are separate actions. The normal CI workflow checks the site with read-only permissions and does not deploy it.

The release workflow accepts a typed publication confirmation and requires the repository variable `PAGES_DEPLOY_ENABLED` to equal the literal string `true`. It also requires the `sigs-uci/sigs-uci.github.io` repository and `refs/heads/main`. Leave the variable unset until publication is authorized.

Before the first website push, an owner must inspect the existing Pages source and other workflows. Branch publishing or another workflow can publish a main push independently of this release gate. Do not assume an inactive new workflow disables an existing release path.

## Before release

Confirm the selected main commit, approved public content, media rights, contact route and locale review. Run the documented local checks and inspect the built preview. Keep a record of the reviewed commit and actual test results. Check that the organization mailbox has an owner and that missing optional content has a truthful public state.

When publication is authorized, enable the repository variable and manually run **Release website** from the reviewed main commit, with **confirm_publication** checked. The workflow checks out that exact workflow SHA, installs from the lockfile, validates content, runs tests, builds search and checks the output before uploading only `dist/`.

The separate deployment job receives Pages and OIDC write permissions and uses the `github-pages` environment. It deploys the artifact from that successful run. No production secret is required in the build job. Action versions are pinned to immutable commits; review their official releases before updating the pins.

After a successful deployment, check the public root, an event deep link, the team pages, search, keyboard navigation and `/404.html`. Record the live URL and deployed SHA. A successful upload or skipped deployment is not proof that a site is live.

## Correct or recover

For a content or code problem, make a new corrective commit on `main`, run all checks and release it through the same gate. Do not force-push or rewrite history. If an urgent release needs an older version, an organization owner should choose the recovery action in Pages after inspecting the actual incident and permissions.

If CI fails, the artifact is not deployed. Read the first failed check and correct that cause locally. If a push or release is rejected by repository protections, retain the work and resolve access with an organization owner. Do not change protections or switch identities to bypass the rejection.

The organization profile is maintained in the separate `.github` repository. Updating it publishes GitHub profile content and does not deploy this website.
