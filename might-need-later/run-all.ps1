$env:SPRING_PROFILES_ACTIVE="prod"
$env:JAVA_TOOL_OPTIONS="-Duser.timezone=Asia/Kolkata"                    

Start-Process powershell -ArgumentList "cd services/api; .\mvnw spring-boot:run"
Start-Process powershell -ArgumentList "cd services/websocket-hub; go run main.go"
Start-Process powershell -ArgumentList "cd services/notification-worker; o run main.go"
Start-Process powershell -ArgumentList "cd services/ticket-worker; go run main.go"
Start-Process powershell -ArgumentList "cd frontend; npm run dev"