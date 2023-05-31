
call jdk1.8.bat

start java -Dspring.config.location=application.properties -jar employee-consumer-0.0.1-SNAPSHOT.jar
