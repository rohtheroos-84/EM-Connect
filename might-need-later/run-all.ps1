param(
	[ValidateSet("local", "prod")]
	[string]$Profile = "local"
)

$env:JAVA_TOOL_OPTIONS = "-Duser.timezone=Asia/Kolkata"

if ($Profile -eq "prod") {
	$env:SPRING_PROFILES_ACTIVE = "prod"
} else {
	$env:SPRING_PROFILES_ACTIVE = "default"
	# Clear accidental datasource overrides for deterministic local startup.
	Remove-Item Env:SPRING_DATASOURCE_URL -ErrorAction SilentlyContinue
	Remove-Item Env:SPRING_DATASOURCE_USERNAME -ErrorAction SilentlyContinue
	Remove-Item Env:SPRING_DATASOURCE_PASSWORD -ErrorAction SilentlyContinue
}

Start-Process powershell -ArgumentList "cd services/api; .\mvnw spring-boot:run"
Start-Process powershell -ArgumentList "cd services/websocket-hub; go run main.go"
Start-Process powershell -ArgumentList "cd services/notification-worker; go run main.go"
Start-Process powershell -ArgumentList "cd services/ticket-worker; go run main.go"
Start-Process powershell -ArgumentList "cd frontend; npm run dev"