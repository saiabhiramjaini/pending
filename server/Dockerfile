FROM oven/bun:1.3
WORKDIR /app
ENV NODE_ENV=production
COPY package.json bun.lock tsconfig.json ./
COPY packages ./packages
COPY src ./src
RUN bun install --production --frozen-lockfile
USER bun
EXPOSE 8080
CMD ["bun", "src/index.ts"]
