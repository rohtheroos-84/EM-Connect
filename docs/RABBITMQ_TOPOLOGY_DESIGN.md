# RabbitMQ Topology Design

## Exchange
- **Name:** `em.events`
- **Type:** `topic`
- **Durable:** `true`

## Dead Letter Exchange
- **Name:** `em.events.dlx`
- **Type:** `topic`
- **Durable:** `true`
- **Dead Letter Queue:** `em.events.dlq`

## Queues

| Queue Name            | Purpose               | Bound Routing Keys                     | Dead Letter Exchange |
|-----------------------|-----------------------|----------------------------------------|----------------------|
| `notification.queue` | Email notifications   | `registration.*`, `event.*`            | `em.events.dlx`      |
| `ticket.queue`       | Ticket generation     | `registration.confirmed`               | `em.events.dlx`      |
| `websocket.queue`    | Real-time updates     | `registration.*`, `event.*`            | `em.events.dlx`      |
| `em.events.dlq`      | Dead letter queue     | `#` (catch all from DLX)               | -                    |

## Bindings

### Primary Exchange: `em.events`
- `notification.queue`
  - `registration.*`
  - `event.*`

- `ticket.queue`
  - `registration.confirmed`

- `websocket.queue`
  - `registration.*`
  - `event.*`

### Dead Letter Exchange: `em.events.dlx`
- `em.events.dlq`
  - `#` (catch all routing key)

## Message Flow Summary
1. Producers publish messages to the `em.events` topic exchange.
2. Messages are routed to queues based on their routing keys.
3. Consumers process messages from their respective queues.
4. Failed or rejected messages are forwarded to `em.events.dlx`.
5. All dead-lettered messages are stored in `em.events.dlq`.
