# DALL-E Web UI (Next.js)

### Create realistic images and art from a description in natural language.

[![DeepScan grade](https://deepscan.io/api/teams/18632/projects/21948/branches/641242/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=18632&pid=21948&bid=641242)

![Xnapper-2023-01-15-23 41 21](https://github.com/AI4Organization/DALL-E-3-WebUI/blob/develop/assets/CleanShot%202023-11-12%20at%2022.26.36%402x.png)

## Requirement
- Get the API token via https://beta.openai.com/account/api-keys. Create `.env` file from `.env.example` file and assign API key to OPENAI_API_KEY.

## Getting Started
1. Clone/Download this project
2. Install:
```bash
npm install
# or
yarn
```
3. Run the development server:
```bash
npm run dev
# or
yarn dev
```
4. Run production server:
```bash
make start-server-local
```
or with docker compse with
```bash
make start-docker-compose-local
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

## Usage
1. Input token start from `sk-`
2. Query anything, e.g. `A sleeping cat and flower vase on the kitchen table in the artist Van Gogh style.`:
<img width="1024" alt="CleanShot 2022-06-18 at 16 36 25@2x" src="https://github.com/AI4Organization/DALL-E-3-WebUI/blob/develop/assets/CleanShot%202023-11-12%20at%2023.02.37%402x.png">

## Developer Notes
- Since V2 is using OpenAI official API.

## This project is inspired by the [original one](https://github.com/1998code/DALLE-2-App) with benefits
- OpenAI SDK latest
- NextJS v14.x
- DALL-E 3
- React latest
