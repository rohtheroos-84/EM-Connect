# RabbitMQ Topology Design

## Exchange
- Name: `em.events`
- Type: `topic`
- Durable: `true`

## Queues
| Queue Name | Purpose | Bound Routing Keys |
|------------|---------|-------------------|
| `notification.queue` | Email notifications | `registration.*`, `event.*` |
| `ticket.queue` | Ticket generation | `registration.confirmed` |
| `websocket.queue` | Real-time updates | `registration.*`, `event.*` |

## Dead Letter Exchange
- Name: `em.events.dlx`
- Type: `topic`
- Queue: `em.events.dlq` (dead letter queue)