# SYNORA — Early Preview

**Tagline:** Intelligence Without Limits

A responsive, mobile-first creative workspace prototype for video, image, voice and writing workflows.

## Included
- Premium dark interface with purple accents
- Video, Image, Voice and Writing studio entry points
- Creative brief editor
- Local project saving using browser localStorage
- Open saved briefs and export project data as JSON
- Responsive layout for Android/mobile screens

## Open
Visit the `synora/` folder on the repository and open `index.html`, or publish this folder with a static hosting workflow.

## Current limitations
This is a front-end prototype, not a production AI platform. It does **not** currently provide:
- Real text-to-image, image editing, text-to-video or video rendering
- Real voice generation
- User accounts or cloud synchronization
- Server-side project storage
- Premium subscriptions or payment processing
- An owner/admin dashboard

Those features require a secure backend and provider integrations. Never place private API keys in browser JavaScript. Payment activation and account ownership should be configured with an authorized adult and the relevant service provider.

## Local data
Projects are stored only in the current browser on the current device. Clearing browser site data can remove them. Use **Export projects** to save a JSON copy.

## Next development stage
1. Select an AI provider and implement server-side API routes.
2. Add authentication and a database with access rules.
3. Add safe upload/storage and job-status handling for generated media.
4. Add subscription and payment integration only after the backend and legal account setup are ready.
5. Add tests, error handling, rate limits and deployment configuration.
