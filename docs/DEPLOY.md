# a deployment runbook

do-this-in-order guide for going live with:
- frontend: netlify or vercel (free)
- api/websocket/workers: render (free)
- postgres: neon (free)
- rabbitmq: cloudamqp (free)

---

## 1) final target architecture

- netlify/vercel serves react app
- render web service #1 runs spring api
- render web service #2 runs websocket-hub
- render worker #1 runs notification-worker
- render worker #2 runs ticket-worker
- neon runs postgres
- cloudamqp runs rabbitmq

free-tier reality:
- render free services may sleep (cold starts)
- websocket + workers are the least stable parts on free plans
- this is good for demo/portfolio/early users, not strict uptime

---

## 2) preflight checklist (do before any deploy)

- [ ] repo is pushed to github
- [ ] local frontend build passes (`frontend -> npm run build`)
- [ ] local api starts (`services/api -> mvnw spring-boot:run`)
- [ ] local go services start (`go run main.go` in each service)
- [ ] you have accounts: render, neon, cloudamqp, netlify/vercel
- [ ] you have a sendgrid sender identity ready (if email flows are needed)

---

## 3) provision managed dependencies first

### 3.1 neon postgres
1. create project + database in neon.
2. copy host, db name, username, password.
3. ensure ssl mode is enabled (`sslmode=require`).
4. keep credentials ready for render api env vars.

tracking:
- [ ] neon db created
- [ ] connection string saved
- [ ] ssl enabled

### 3.2 cloudamqp rabbitmq
1. create free cloudamqp instance.
2. copy amqp url.
3. copy management dashboard url and credentials.
4. note vhost, username, password.

tracking:
- [ ] cloudamqp instance created
- [ ] amqp url saved
- [ ] dashboard access verified

---

## 4) deploy spring api on render

1. create new render web service from github repo.
2. set root directory to `services/api`.
3. use:
   - build command: `./mvnw clean package -DskipTests`
   - start command: `java -jar target/api-0.0.1-SNAPSHOT.jar`
4. set health check path to `/actuator/health`.
5. trigger deploy.

api env vars to set in render:
- `SPRING_PROFILES_ACTIVE=prod`
- `SPRING_DATASOURCE_URL=jdbc:postgresql://<neon-host>/<db>?sslmode=require`
- `SPRING_DATASOURCE_USERNAME=<neon-user>`
- `SPRING_DATASOURCE_PASSWORD=<neon-password>`
- `SPRING_RABBITMQ_HOST=<cloudamqp-host>`
- `SPRING_RABBITMQ_PORT=<cloudamqp-port>`
- `SPRING_RABBITMQ_USERNAME=<cloudamqp-user>`
- `SPRING_RABBITMQ_PASSWORD=<cloudamqp-pass>`
- `SPRING_RABBITMQ_VIRTUAL_HOST=<cloudamqp-vhost>`
- `JWT_SECRET=<your-value>`
- `GOOGLE_OAUTH_CLIENT_ID=<if-using-google-login>`

tracking:
- [ ] api service created
- [ ] env vars set
- [ ] health check green
- [ ] flyway migration completed

---

## 5) deploy websocket-hub on render

1. create second render web service.
2. root directory: `services/websocket-hub`.
3. build command: `go build -o app .`
4. start command: `./app`
5. set rabbitmq env vars.

required env vars:
- `RABBITMQ_URL=<cloudamqp-amqp-url>`
- `RABBITMQ_EXCHANGE=em.events`
- `RABBITMQ_QUEUE=websocket.queue`
- `RABBITMQ_DLQ_EXCHANGE=em.events.dlx`
- `RABBITMQ_DLQ_QUEUE=websocket.dlq`
- `ENVIRONMENT=production`

tracking:
- [ ] websocket service deployed
- [ ] /health endpoint works
- [ ] websocket connects from browser (`wss://.../ws`)

---

## 6) deploy workers on render

### 6.1 notification-worker
1. create render background worker.
2. root directory: `services/notification-worker`.
3. build: `go build -o app .`
4. start: `./app`

env vars:
- `RABBITMQ_URL=<cloudamqp-amqp-url>`
- `SENDGRID_API_KEY=<key>`
- `EMAIL_FROM_ADDRESS=<verified-sender>`
- `EMAIL_FROM_NAME=EM-Connect`
- `ENVIRONMENT=production`

### 6.2 ticket-worker
1. create second render background worker.
2. root directory: `services/ticket-worker`.
3. build: `go build -o app .`
4. start: `./app`

env vars:
- `RABBITMQ_URL=<cloudamqp-amqp-url>`
- `TICKET_SECRET_KEY=<value>`
- `TICKET_QR_OUTPUT_DIR=./tickets/qr`
- `TICKET_METADATA_DIR=./tickets/metadata`
- `ENVIRONMENT=production`

tracking:
- [ ] notification-worker deployed
- [ ] ticket-worker deployed
- [ ] both are consuming messages

---

## 7) deploy frontend on netlify/vercel

1. create site/project from github.
2. set project root to `frontend`.
3. build command: `npm run build`
4. output directory: `dist`
5. deploy.

tracking:
- [ ] site deployed
- [ ] app loads on generated URL

---

## 8) required code/config changes for live functionality (non-security)

these are important. without them, deployment may succeed but key features will fail.

### 8.1 make frontend API base url env-driven

why:
- current frontend api client uses `/api` relative path, which only works locally with vite proxy or same-origin hosting.
- with netlify/vercel frontend + render api, requests can go to wrong host.

file:
- `frontend/src/services/api.js`

change:
- from: `const API_BASE = '/api';`
- to: `const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';`

env to set on netlify/vercel:
- `VITE_API_BASE_URL=https://<api-service>.onrender.com/api`

tracking:
- [ ] `api.js` updated
- [ ] frontend env var set
- [ ] login + events fetch work in hosted frontend

### 8.2 make frontend websocket url env-driven

why:
- current websocket context derives ws host from frontend host.
- in hosted setup websocket is a different render service host.

file:
- `frontend/src/context/WebSocketContext.jsx`

change:
- prefer `import.meta.env.VITE_WS_URL` in production.
- keep current fallback for local dev.

env to set:
- `VITE_WS_URL=wss://<websocket-service>.onrender.com/ws`

tracking:
- [ ] websocket context updated
- [ ] `VITE_WS_URL` set
- [ ] realtime updates received in hosted frontend

### 8.3 fix hardcoded image URL assembly in frontend

why:
- multiple components build image URLs using hardcoded `/api...`.
- this breaks when frontend and api are on different origins.

files to update:
- `frontend/src/pages/EventList.jsx`
- `frontend/src/pages/EventDetail.jsx`
- `frontend/src/components/EventFormModal.jsx`
- `frontend/src/pages/Profile.jsx`

what to do:
1. create one helper that prefixes backend-relative image paths with `VITE_API_BASE_URL` origin.
2. replace all direct `/api${...}` constructions with the helper.

tracking:
- [ ] helper added
- [ ] all hardcoded `/api` image joins removed
- [ ] avatar/banner images render correctly in hosted frontend

### 8.4 solve file persistence + cross-service file access

why:
- current code stores avatars/banners/qr files on local disk.
- api and ticket-worker run on separate containers/services.
- free hosted disk is often ephemeral and not shared.
- result: qr checks/downloads and avatar/banner persistence can break.

current impacted areas:
- api avatar/banner local file storage and serving
- ticket-worker local qr/metadata storage
- api ticket service reading qr file from local path

what to implement:
- move file assets to object storage (recommended: cloudinary free for now).
- store returned URL/path in db.
- update api and ticket-worker to use object storage URLs instead of local shared disk assumptions.

tracking:
- [ ] object storage selected
- [ ] upload paths migrated
- [ ] qr retrieval works after redeploy/restart
- [ ] avatars/banners persist after redeploy/restart

### 8.5 make websocket-hub compatible with render port model

why:
- render expects app to listen on `PORT` env var.
- current websocket config reads `SERVER_PORT` only.

file:
- `services/websocket-hub/config/config.go`

recommended logic:
- use `PORT` if present, else `SERVER_PORT`, else `8081`.

tracking:
- [ ] websocket config supports `PORT`
- [ ] websocket hub reachable in render without manual port mismatch

### 8.6 configure spa fallback routing

why:
- refresh on nested routes can return 404 on static hosts unless rewrite/fallback is configured.

what to add:
- netlify: redirect all unmatched routes to `/index.html` (200)
- vercel: rewrite fallback to `/index.html`

tracking:
- [ ] fallback configured
- [ ] route refresh works for nested pages

### 8.7 configure cors for cross-origin frontend/api (functional requirement)

why:
- if frontend and api are different origins, browser preflight can fail.
- this is needed for the app to function in browser.

what to do:
1. allow your netlify/vercel origin(s).
2. allow auth header and methods used by frontend.
3. verify preflight success in browser network tab.

tracking:
- [ ] cors configured
- [ ] preflight succeeds
- [ ] authenticated requests work from hosted frontend

---

## 9) deploy order you should actually follow

1. deploy neon + cloudamqp first
2. deploy api on render
3. deploy websocket-hub
4. deploy workers
5. apply code changes in section 8
6. deploy frontend with env vars
7. run smoke tests
8. only then share live link

tracking:
- [ ] order followed

---

## 10) smoke test checklist (must pass)

- [ ] open hosted frontend
- [ ] register and login
- [ ] list/search events
- [ ] create and publish event (admin)
- [ ] register for event
- [ ] notification sent
- [ ] ticket generated and qr endpoint returns image
- [ ] websocket update appears on client
- [ ] avatar upload + banner upload visible
- [ ] restart/redeploy one service and confirm assets still work

---

## 11) known gotchas + fixes

### gotcha: render api works, frontend still says network error
- likely wrong `VITE_API_BASE_URL` or missing cors.

### gotcha: websocket never connects in production
- likely missing `VITE_WS_URL` or websocket service not listening on render `PORT`.

### gotcha: qr says not generated or not found after deploy
- local disk path assumption; move qr assets to object storage.

### gotcha: avatar/banner missing after restart
- local disk not durable; use object storage.

### gotcha: deep links 404 on refresh
- missing spa fallback rewrites.

---

## 12) needed code changes to function properly in live?

yes.
minimum required (non-security):
1. env-driven api base url in frontend
2. env-driven websocket url in frontend
3. remove hardcoded same-origin image url assembly
4. migrate avatar/banner/qr files to durable shared storage
5. websocket port binding compatible with render `PORT`
6. spa rewrite fallback
7. cors for cross-origin browser calls

no skipping these, or key features will break!!!