package com.emconnect.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.TimeZone;

@SpringBootApplication
@EnableScheduling
public class ApiApplication {

	public static void main(String[] args) {
		// Fix: JVM reports "Asia/Calcutta" which PostgreSQL doesn't recognise
		TimeZone.setDefault(TimeZone.getTimeZone("Asia/Kolkata"));
		SpringApplication.run(ApiApplication.class, args);
	}

}
