# Deployment

This project builds a Vite React client and bundles an Express `server.ts` with `esbuild`.

Local Docker build and run:

```bash
# build image
docker build -t zenos-core:latest .

# run (set any required env vars, e.g. GEMINI_API_KEY)
docker run -p 3000:3000 -e GEMINI_API_KEY=$GEMINI_API_KEY zenos-core:latest
```

GitHub Container Registry (GHCR):

- On push to `main` the included GitHub Actions workflow `/.github/workflows/docker-publish.yml` will build and push images to `ghcr.io/<owner>/<repo>`.
- To deploy to a host (Render, Fly, Docker, etc.) use the pushed image `ghcr.io/<owner>/<repo>:latest`.

Render (example):

1. Create a new Web Service on Render and choose "Docker".
2. For the image registry use `ghcr.io` and set the image to `ghcr.io/<owner>/<repo>:latest`.
3. Add environment variables (for example `GEMINI_API_KEY`) in the Render dashboard.
4. Start the service and Render will pull the container.

If you want, I can:

- Run a local build and smoke test here.
- Add a Render `service.yaml` for one-click deploy.
- Wire up automatic deploys to a specific provider (requires your provider secret/API key).
