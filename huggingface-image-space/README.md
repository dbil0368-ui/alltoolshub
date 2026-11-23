---
title: SYNORA Image AI
emoji: 🎨
colorFrom: purple
colorTo: blue
sdk: gradio
sdk_version: 5.0.0
app_file: app.py
pinned: false
license: apache-2.0
---

# SYNORA Image AI — FLUX.1 schnell

This is a starter Hugging Face Space for generating images with the open-weight
[FLUX.1 schnell](https://huggingface.co/black-forest-labs/FLUX.1-schnell) model.

## Deploy

1. Sign in to Hugging Face and create a new **public Space**.
2. Choose **Gradio** as the SDK.
3. Choose **ZeroGPU** hardware if it is available to your account. Otherwise,
   select an available GPU only if you understand its cost. Do not enable paid
   hardware for this zero-budget project.
4. Upload `app.py` and `requirements.txt` from this folder into the Space root.
5. Wait for the Space to build. If the free GPU queue is unavailable, try later.

## Important

- This is a hosted demo, not a dedicated always-on server.
- Free ZeroGPU access has quotas, queues, and eligibility restrictions. It may
  not be available to every account or at every time.
- Never add API tokens, passwords, or private keys to this repository.
- Do not submit private or sensitive images or prompts.
- The FLUX.1 schnell model is released under Apache 2.0; review the model card
  and all dependency terms before commercial use.
- The starter uses 4 inference steps and modest image dimensions to reduce
  compute requirements. GPU memory and startup time can still be limiting.
- This Space does not yet provide a production API, user accounts, cloud
  history, or a private inference service for the SYNORA website.

## Next integration stage

After the Space is running, configure a server-side integration from SYNORA.
Keep any Hugging Face access token in the hosting provider's encrypted
environment variables; never expose it in browser JavaScript.
