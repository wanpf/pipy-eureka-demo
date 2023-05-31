
setlocal

cd /d %~dp0

call jdk1.8.bat

start java -Dspring.config.location=application-8011.properties -jar employee-producer-0.0.1-SNAPSHOT.jar

start java -Dspring.config.location=application-8012.properties -jar employee-producer-0.0.1-SNAPSHOT.jar

start java -Dspring.config.location=application-8013.properties -jar employee-producer-0.0.1-SNAPSHOT.jar
