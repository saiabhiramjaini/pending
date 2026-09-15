FROM oven/bun:1.2
WORKDIR /app
COPY package.json bun.lock ./
COPY packages ./packages
COPY src ./src
COPY drizzle.config.ts tsconfig.json ./
RUN bun install --cwd packages/api-contract && bun install --frozen-lockfile || bun install
EXPOSE 3000
CMD ["bun", "src/index.ts"]
