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

