# SYNORA — Early Preview

**Tagline:** Intelligence Without Limits

SYNORA is a responsive, mobile-first creative workspace prototype for video, image, voice and writing workflows.

## Included and working in this preview
- Premium dark interface with purple accents
- Video, Image, Voice and Writing studio entry points
- Creative brief editor with a 2,000-character limit
- Save project briefs locally in the current browser
- Reopen saved briefs
- Export saved project data as JSON
- Responsive layout for Android and desktop browsers
- GitHub Actions workflow to publish only this `synora/` folder to GitHub Pages

## Publish
A deployment workflow is included at `.github/workflows/synora-pages.yml`.

1. Open the repository **Settings → Pages**.
2. Set **Build and deployment → Source** to **GitHub Actions** if it is not already selected.
3. Open the **Actions** tab and select **Deploy SYNORA to GitHub Pages**.
4. Run the workflow with **Run workflow**, or push a later change under `synora/`.
5. Wait for the deploy job to finish successfully. The actual public URL appears in the workflow's deployment environment.

The expected project URL, if GitHub Pages is enabled for this repository, is:
`https://dbil0368-ui.github.io/alltoolshub/`

Do not treat that URL as live until the GitHub Pages deployment reports success.

## Important limitations
This is a front-end prototype, not a production AI platform. It does **not** currently provide:
- Real text-to-image, image editing, background removal, text-to-video or video rendering
- Real voice generation
- User accounts, login, or cloud synchronization
- Server-side project storage
- Premium subscriptions or payment processing
- A protected owner/admin dashboard

Those capabilities need a secure backend, database, authentication, storage, and provider integrations. Never put private API keys or admin credentials in browser JavaScript or a public repository. Payment activation and legal account setup must be handled by an authorized adult with the relevant service provider.

## Local data and privacy
Project briefs are saved only in the browser on the device being used. They are not uploaded to SYNORA servers. Clearing browser site data can remove them. Use **Export projects** to keep a JSON backup. Avoid saving sensitive personal information in project briefs.

## Production roadmap
1. Choose an AI provider and build server-side API routes with secrets kept on the server.
2. Add authentication and a database with per-user access rules.
3. Add safe file upload, storage, moderation, and generation-job status handling.
4. Add an admin area protected by server-side role checks and audit logs.
5. Add subscription/payment integration only after backend and legal account setup are ready.
6. Add automated tests, rate limits, monitoring, accessibility checks, and deployment checks.
