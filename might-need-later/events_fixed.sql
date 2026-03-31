--
-- PostgreSQL database dump
--

\restrict CelLUM72zoIXgTHbm2ih4tA1jXOa9SQKzr9jvegHvPz9rLieD0eGTuftkwdbeqk

-- Dumped from database version 16.11 (Debian 16.11-1.pgdg13+1)
-- Dumped by pg_dump version 16.11 (Debian 16.11-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: emconnect
--

INSERT INTO public.events (title, description, location, start_date, end_date, capacity, status, organizer_id, created_at, updated_at, category, tags, banner_url) VALUES
('Spring Boot Conference 2026','Learn microservices with Spring Boot','Hyderabad Convention Center','2026-03-01 10:00:00','2026-03-01 18:00:00',100,'PUBLISHED',3,'2026-02-14 16:18:07.083312','2026-02-14 16:19:11.094347',NULL,NULL,NULL),
('Go Microservices Workshop','Building event-driven services with Go and RabbitMQ','Bangalore Tech Park','2026-04-15 09:00:00','2026-04-15 17:00:00',50,'PUBLISHED',3,'2026-02-14 16:33:25.130464','2026-02-14 16:33:34.692982',NULL,NULL,NULL),
('WebSocket Live Test','Testing real-time updates!','Virtual Room','2026-11-01 10:00:00','2026-11-01 17:00:00',50,'PUBLISHED',3,'2026-02-15 14:38:02.958568','2026-02-15 14:38:16.705252',NULL,NULL,NULL),
('WebSocket Live Test 2','Testing real-time updates!','Virtual Room','2026-11-01 10:00:00','2026-11-01 17:00:00',50,'PUBLISHED',3,'2026-02-15 14:40:06.401469','2026-02-15 14:40:15.747206',NULL,NULL,NULL),
('Live Count Test','Testing live participant counts via WebSocket','Conference Hall A','2026-12-01 10:00:00','2026-12-01 18:00:00',100,'PUBLISHED',3,'2026-02-15 16:14:38.215047','2026-02-15 16:14:54.95746',NULL,NULL,NULL),
('Cancel Test Event','Testing event cancellation broadcast','Room B','2026-12-05 09:00:00','2026-12-05 17:00:00',50,'CANCELLED',3,'2026-02-15 16:21:04.030885','2026-02-15 16:21:46.635292',NULL,NULL,NULL),
('Bauhaus Event 1','Test event number 1 for Phase 8.2','Hall 1','2026-06-01 10:00:00','2026-06-01 18:00:00',60,'PUBLISHED',3,'2026-02-18 12:11:13.74619','2026-02-18 12:11:14.089286',NULL,NULL,NULL),
('Bauhaus Event 2','Test event number 2 for Phase 8.2','Hall 2','2026-06-02 10:00:00','2026-06-02 18:00:00',70,'PUBLISHED',3,'2026-02-18 12:11:14.185225','2026-02-18 12:11:14.246145',NULL,NULL,NULL),
('Bauhaus Event 3','Test event number 3 for Phase 8.2','Hall 3','2026-06-03 10:00:00','2026-06-03 18:00:00',80,'PUBLISHED',3,'2026-02-18 12:11:14.309257','2026-02-18 12:11:14.364098',NULL,NULL,NULL),
('Bauhaus Event 4','Test event number 4 for Phase 8.2','Hall 4','2026-06-04 10:00:00','2026-06-04 18:00:00',90,'PUBLISHED',3,'2026-02-18 12:11:14.421394','2026-02-18 12:11:14.48279',NULL,NULL,NULL),
('Bauhaus Event 5','Test event number 5 for Phase 8.2','Hall 5','2026-06-05 10:00:00','2026-06-05 18:00:00',100,'PUBLISHED',3,'2026-02-18 12:11:14.555753','2026-02-18 12:11:14.6275',NULL,NULL,NULL),
('admin test','registerrr','a - 407','2026-02-28 02:30:00','2026-03-02 02:30:00',101,'COMPLETED',3,'2026-02-27 19:50:03.799243','2026-02-27 19:50:29.365047',NULL,NULL,NULL),
('banner test','testinggggggg','a - 407','2026-04-02 03:30:00','2026-04-28 03:30:00',100,'PUBLISHED',3,'2026-03-03 19:59:35.421051','2026-03-03 19:59:43.514529','ART','woohoo',NULL),
('AI & ML Summit 2026','A full-day summit covering latest trends in artificial intelligence and machine learning','Chennai Trade Centre','2026-04-12 09:00:00','2026-04-12 18:00:00',250,'PUBLISHED',3,'2026-03-10 10:00:00','2026-03-10 10:00:00','TECHNOLOGY','ai,ml,data',NULL),
('FinTech Innovations Expo','Exploring the future of digital payments, blockchain, and financial services','Mumbai Convention Center','2026-05-08 10:00:00','2026-05-08 17:00:00',300,'PUBLISHED',3,'2026-03-12 11:00:00','2026-03-12 11:00:00','FINANCE','fintech,blockchain',NULL),
('Cloud Computing Bootcamp','Hands-on workshop on AWS, Azure, and scalable cloud architectures','Bangalore Tech Hub','2026-06-20 09:30:00','2026-06-20 16:30:00',120,'PUBLISHED',3,'2026-03-15 12:00:00','2026-03-15 12:00:00','TECHNOLOGY','cloud,aws,azure',NULL),
('Startup Pitch Night','Early-stage startups pitch to investors and industry experts','Hyderabad Startup Hub','2026-07-05 18:00:00','2026-07-05 21:00:00',80,'PUBLISHED',3,'2026-03-18 13:00:00','2026-03-18 13:00:00','BUSINESS','startup,pitch',NULL),
('Cybersecurity Awareness Workshop','Learn best practices to secure systems and prevent cyber threats','Delhi Tech Park','2026-08-14 10:00:00','2026-08-14 15:00:00',150,'PUBLISHED',3,'2026-03-20 14:00:00','2026-03-20 14:00:00','SECURITY','cybersecurity,network',NULL),
('Data Science Hackathon','24-hour hackathon focused on real-world data science challenges','IIT Madras Campus','2026-09-10 09:00:00','2026-09-11 09:00:00',200,'PUBLISHED',3,'2026-03-22 15:00:00','2026-03-22 15:00:00','TECHNOLOGY','datascience,hackathon',NULL),
('UI/UX Design Conference','Exploring modern design trends and user experience strategies','Pune Convention Hall','2026-10-03 10:00:00','2026-10-03 17:00:00',180,'PUBLISHED',3,'2026-03-24 16:00:00','2026-03-24 16:00:00','DESIGN','ui,ux',NULL),
('E-Commerce Growth Summit','Scaling online businesses with marketing and analytics strategies','Gurgaon Business Center','2026-11-18 09:30:00','2026-11-18 17:30:00',220,'PUBLISHED',3,'2026-03-26 17:00:00','2026-03-26 17:00:00','BUSINESS','ecommerce,marketing',NULL),
('Year-End Tech Conference 2026','Wrap-up of the years biggest tech advancements and future outlook','Bangalore International Exhibition Centre','2026-12-12 09:00:00','2026-12-12 18:00:00',400,'PUBLISHED',3,'2026-03-28 18:00:00','2026-03-28 18:00:00','TECHNOLOGY','innovation,conference',NULL);

--
-- Name: events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: emconnect
--

-- SELECT pg_catalog.setval('public.events_id_seq', 13, true);


--
-- PostgreSQL database dump complete
--

\unrestrict CelLUM72zoIXgTHbm2ih4tA1jXOa9SQKzr9jvegHvPz9rLieD0eGTuftkwdbeqk

