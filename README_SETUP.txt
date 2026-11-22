ALLTOOLSHUB — FREE AI CHAT STARTER

Files: index.html (website frontend), api/chat.js (Vercel serverless AI endpoint).

The AI chat requires deployment on Vercel and a server-side OPENROUTER_API_KEY environment variable. Do not put the key in public HTML or commit it to GitHub. Free model availability and usage limits can change; unlimited usage is not guaranteed. Do not add a payment method or buy credits for this starter.

Deploy by importing this GitHub repository into Vercel. Keep api/chat.js in the api folder at the repository root. In Vercel Project Settings > Environment Variables, add OPENROUTER_API_KEY privately, then redeploy. The AI chat will not work until this is configured.

The tools directory contains listings; not every listed tool is implemented. Some browser tools load public libraries from CDNs and require internet.