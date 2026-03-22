# a deployment runbook

## 0) architecture you will deploy

- frontend: netlify/vercel static deploy
- api: render web service
- websocket-hub: render web service
- notification-worker: render background worker
- ticket-worker: render background worker
- database: neon postgres
- broker: cloudamqp rabbitmq
- email: sendgrid (free trial/free tier as available)

notes:
- free render services can sleep/cold start.
- websocket and workers may be less stable on pure free plans.
- this setup is good for learning/demo/small traffic, not strict production sla.

---

## 1) prereq checklist

- [ ] github repo is up to date
- [ ] you can build frontend locally (`npm run build`)
- [ ] api runs locally from `services/api`
- [ ] go services run locally (`go run main.go` in each worker/hub)
- [ ] you have accounts on netlify or vercel, render, neon, cloudamqp, sendgrid

---

## 2) create managed services first (neon + cloudamqp)

### 2.1 neon postgres
1. create a neon project and database.
2. copy the connection string (host, db, user, password).
3. keep ssl enabled (`sslmode=require`).
4. keep this handy for render env vars.

- [ ] created
- [ ] connection string copied
- [ ] tested from local app or psql

### 2.2 cloudamqp rabbitmq
1. create a free instance.
2. copy amqp url (`amqps://...`) and management url.
3. note vhost, username, password.
4. confirm connection from local once if possible.

- [ ] created
- [ ] amqp url copied
- [ ] management login works

---

## 3) deploy api on render

1. create a new render web service from this repo.
2. root directory: `services/api`.
3. runtime/build:
   - build command: `./mvnw clean package -DskipTests`
   - start command: `java -jar target/api-0.0.1-SNAPSHOT.jar`
4. set instance region near your users.
5. enable auto deploy from main branch.

set env vars in render (api service):
- `SPRING_PROFILES_ACTIVE=prod`
- `SPRING_DATASOURCE_URL=jdbc:postgresql://<neon-host>/<db>?sslmode=require`
- `SPRING_DATASOURCE_USERNAME=<neon-user>`
- `SPRING_DATASOURCE_PASSWORD=<neon-password>`
- `SPRING_RABBITMQ_ADDRESSES=<cloudamqp-host:5671 or 5672>` or `SPRING_RABBITMQ_HOST` + `SPRING_RABBITMQ_PORT`
- `SPRING_RABBITMQ_USERNAME=<cloudamqp-user>`
- `SPRING_RABBITMQ_PASSWORD=<cloudamqp-password>`
- `SPRING_RABBITMQ_VIRTUAL_HOST=<cloudamqp-vhost>`
- `JWT_SECRET=<your-secret>`
- `GOOGLE_OAUTH_CLIENT_ID=<your-client-id-if-used>`

health check:
- `/actuator/health` (or your existing health endpoint)

- [ ] render api created
- [ ] env vars set
- [ ] health check green
- [ ] flyway migrations applied

---

## 4) deploy websocket-hub on render

1. create second render web service.
2. root directory: `services/websocket-hub`.
3. build command: `go build -o app .`
4. start command: `./app`

set env vars:
- `SERVER_PORT` (render usually provides `PORT`; if needed map/read it)
- `RABBITMQ_URL=<cloudamqp-amqp-url>`
- `RABBITMQ_EXCHANGE=em.events`
- `RABBITMQ_QUEUE=websocket.queue`
- `RABBITMQ_DLQ_EXCHANGE=em.events.dlx`
- `RABBITMQ_DLQ_QUEUE=websocket.dlq`
- `ENVIRONMENT=production`

- [ ] websocket service created
- [ ] can open websocket endpoint from browser console
- [ ] receives events after registration/event actions

---

## 5) deploy workers on render

### 5.1 notification-worker
1. create render background worker.
2. root directory: `services/notification-worker`.
3. build command: `go build -o app .`
4. start command: `./app`

env vars:
- `RABBITMQ_URL=<cloudamqp-amqp-url>`
- `SENDGRID_API_KEY=<sendgrid-key>`
- `EMAIL_FROM_ADDRESS=<verified-sender>`
- `EMAIL_FROM_NAME=EM-Connect`
- `ENVIRONMENT=production`

### 5.2 ticket-worker
1. create another render background worker.
2. root directory: `services/ticket-worker`.
3. build command: `go build -o app .`
4. start command: `./app`

env vars:
- `RABBITMQ_URL=<cloudamqp-amqp-url>`
- `TICKET_SECRET_KEY=<secret>`
- `TICKET_QR_OUTPUT_DIR=./tickets/qr`
- `TICKET_METADATA_DIR=./tickets/metadata`
- `ENVIRONMENT=production`

- [ ] notification worker running
- [ ] ticket worker running
- [ ] both consume messages from rabbitmq

---

## 6) deploy frontend (netlify or vercel)

1. import repo and set project root to `frontend`.
2. build command: `npm run build`
3. output directory: `dist`
4. deploy and keep generated URL:
   - netlify: `https://<site>.netlify.app`
   - vercel: `https://<site>.vercel.app`

- [ ] frontend deployed
- [ ] homepage loads

---

## 7) code changes needed for live functionality (non-security)

without these, some features will fail in real deployment.

### 7.1 frontend API base URL must be env-driven

current code uses same-origin `/api`, which works in local vite proxy but usually fails when frontend and api are on different hosts.

file to update:
- `frontend/src/services/api.js`

current:
- `const API_BASE = '/api';`

recommended:
- `const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';`

then set in netlify/vercel env:
- `VITE_API_BASE_URL=https://<your-api>.onrender.com/api`

status:
- [ ] code changed
- [ ] env var set

### 7.2 frontend websocket URL must be env-driven

current code derives websocket endpoint from frontend host (`window.location.host`).
if websocket-hub is on render under another host, realtime updates will fail.

file to update:
- `frontend/src/context/WebSocketContext.jsx`

recommended:
- first preference: `import.meta.env.VITE_WS_URL`
- fallback to current local behavior only for dev

example behavior:
- production: `wss://<your-websocket-hub>.onrender.com/ws`
- local: current auto-derived ws URL

set in netlify/vercel env:
- `VITE_WS_URL=wss://<your-websocket-hub>.onrender.com/ws`

status:
- [ ] code changed
- [ ] env var set

### 7.3 ticket qr files and avatar/banner files need durable shared storage

right now files are written to local disk paths:
- api avatar/banner files under local folders
- ticket-worker qr/metadata under local folders
- api ticket service reads qr from local path

on free hosted containers, local disk can be ephemeral and is not shared between services.
this will break features such as:
- qr readiness/check/download
- persistent avatar/banner serving after restarts/redeploys

minimum viable fixes (choose one path):

path a (recommended): move file assets to object storage
1. use cloudinary free (or equivalent) for avatars + banners + qr images.
2. store returned public URL in db.
3. update api/ticket-worker to read/write URLs, not local files.

path b (temporary only): run api + ticket-worker on same host with shared persistent disk
1. not ideal on free multi-service platforms.
2. usually not reliable on render free.

status:
- [ ] decided storage strategy
- [ ] implemented
- [ ] tested after redeploy/restart

### 7.4 frontend routing fallback (spa refresh)

for netlify/vercel, deep-link refresh can 404 unless fallback is configured.

- netlify: add redirects rule to serve `index.html`
- vercel: add rewrite rule to `index.html`

status:
- [ ] configured
- [ ] deep-link refresh works (e.g., `/events/123`)

---

## 8) CORS note (functional if cross-origin)

if frontend and api are on different origins, browser requests may fail unless cors is configured.

this is often treated as security, but it is also a functional requirement for hosted frontend + hosted api.

practical plan:
1. add explicit allowed origins for your netlify/vercel URL(s).
2. allow methods/headers needed by your frontend.
3. deploy and verify preflight requests pass.

status:
- [ ] cors configured
- [ ] browser network tab shows successful preflight

---

## 9) smoke test after full deploy

run in this order:
1. open frontend
2. register/login
3. create event (admin)
4. publish event
5. register for event
6. verify:
   - api writes registration
   - rabbitmq receives event
   - ticket worker processes message
   - notification worker sends email
   - websocket update appears on client
7. upload avatar/banner and verify still available after service restart/redeploy
8. open ticket qr endpoint and confirm image loads

- [ ] auth works
- [ ] events CRUD works
- [ ] registration works
- [ ] ticket flow works
- [ ] notifications work
- [ ] websocket live updates work
- [ ] file assets survive restart

---

## 10) known free-tier constraints (important)

- render free services may sleep -> cold starts
- websocket uptime can be inconsistent on free tiers
- background worker runtime can be limited
- cloudamqp free has tight limits
- if you outgrow this, first upgrade target should be backend/worker hosting

---

## 11) go-live checklist

- [ ] all deploy services are green
- [ ] frontend env vars set correctly
- [ ] api env vars set correctly
- [ ] worker env vars set correctly
- [ ] migrations are current
- [ ] rabbitmq queues/exchanges active
- [ ] end-to-end smoke tests pass
- [ ] restart/redeploy test done once
- [ ] rollback notes prepared

---

## needed code changes for live:

yes. at minimum:
1. env-driven api url in frontend
2. env-driven websocket url in frontend
3. durable shared file/object storage strategy for avatar/banner/qr
4. spa rewrite fallback for netlify/vercel
5. cors config if frontend and api are on different origins

no skippinng these, or deploying without them, will lead to broken functionality in a live environment.
