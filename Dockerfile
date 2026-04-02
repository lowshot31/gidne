FROM node:20-alpine AS builder
WORKDIR /app

# 패키지 매니저 파일 복사 (package.json, package-lock.json 등)
COPY package*.json ./
RUN npm install

# 소스 코드 복사 및 빌드
COPY . .
RUN npm run build:docker

# --- 2. 실행 스테이지 (프로덕션) ---
FROM node:20-alpine AS runner
WORKDIR /app

# 프로덕션 서버 구동에 필요한 환경변수
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321

# 빌드 스테이지에서 생성된 결과물 복사
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 4321

# Astro node 어댑터를 사용하면 dist/server/entry.mjs 파일이 생성됩니다.
CMD ["node", "./dist/server/entry.mjs"]
