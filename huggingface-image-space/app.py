import gradio as gr
import spaces
import torch
from diffusers import DiffusionPipeline

MODEL_ID = "black-forest-labs/FLUX.1-schnell"
pipe = None

def get_pipeline():
    global pipe
    if pipe is None:
        dtype = torch.float16
        pipe = DiffusionPipeline.from_pretrained(
            MODEL_ID,
            torch_dtype=dtype,
        )
        pipe.to("cuda")
    return pipe

@spaces.GPU(duration=120)
def generate_image(prompt, aspect, seed):
    prompt = (prompt or "").strip()
    if not prompt:
        raise gr.Error("Please enter an image description.")
    if len(prompt) > 800:
        raise gr.Error("Please keep the prompt under 800 characters.")

    sizes = {
        "Square · 512 × 512": (512, 512),
        "Portrait · 512 × 768": (512, 768),
        "Landscape · 768 × 512": (768, 512),
    }
    width, height = sizes.get(aspect, (512, 512))
    generator = torch.Generator(device="cuda").manual_seed(int(seed))

    result = get_pipeline()(
        prompt=prompt,
        width=width,
        height=height,
        num_inference_steps=4,
        guidance_scale=0.0,
        generator=generator,
    )
    return result.images[0]

with gr.Blocks(theme=gr.themes.Soft(), title="SYNORA Image AI") as demo:
    gr.Markdown(
        "# SYNORA Image AI\n"
        "Open-source FLUX.1 schnell image generation. "
        "This demo runs on Hugging Face-hosted GPU hardware."
    )
    with gr.Row():
        with gr.Column():
            prompt = gr.Textbox(
                label="Describe your image",
                placeholder="A futuristic purple city at sunset, cinematic lighting...",
                lines=4,
                max_lines=6,
                max_length=800,
            )
            aspect = gr.Dropdown(
                choices=[
                    "Square · 512 × 512",
                    "Portrait · 512 × 768",
                    "Landscape · 768 × 512",
                ],
                value="Square · 512 × 512",
                label="Image size",
            )
            seed = gr.Number(value=42, precision=0, label="Seed")
            run = gr.Button("Generate image", variant="primary")
        output = gr.Image(label="Your generated image", type="pil")
    run.click(
        fn=generate_image,
        inputs=[prompt, aspect, seed],
        outputs=output,
    )
    gr.Markdown(
        "Free GPU access may be queued, limited, or temporarily unavailable. "
        "Do not submit private or sensitive photos or prompts. "
        "Model: FLUX.1 schnell · Apache 2.0 model license."
    )

if __name__ == "__main__":
    demo.queue().launch()
