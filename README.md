# 1. pipy-eureka-demo
在基于 eureka服务注册、服务发现的 Spring Cloud 环境，使用 Pipy 来提供服务网关功能，增强服务治理。  

# 2. 演示使用 pipy 作为 Spring Cloud 微服务网关，实现服务的负载均衡、访问限流  

# 3. 部署说明 
部署架构图：  
<img width="789" alt="image" src="https://github.com/wanpf/pipy-eureka-demo/assets/2276200/ee10b54f-7d3e-49e7-959c-ca41d136013e">  

## 3.1 启动 Eureka 服务  
使用 jdk1.8 版本，运行 spring-projects/jar/eureka-server/run.bat （windows 脚本） 

## 3.2 启动 producer 微服务  
使用 jdk1.8 版本，运行 spring-projects/jar/employee-producer-eureka/run.bat (windows 脚本）  

## 3.3 启动一个 pipy 作为 pipy repo 
a）启动命令 pipy --admin-port=5050  
b）新建一个 codebase, 名字：pipy-service  
c）修改 init-repo.sh 里面的IP地址（修改成pipy repo的IP地址），然后运行 init-repo.sh  

# 3.4 启动 eureka-agent 服务  
a）修改 eureka-agent/config.json 配置文件  
<img width="508" alt="image" src="https://github.com/wanpf/pipy-eureka-demo/assets/2276200/78e3506f-c8c1-441d-84e9-9744dac8ca6b">  
b）运行 pipy eureka-agent/main.js  

# 3.5 启动 pipy work/service   
运行 pipy http://pipy repo IP地址:5050/repo/pipy-service/  

# 3.6 运行 consumer 微服务  
使用 jdk1.8 版本，运行 spring-projects/jar/eureka-employee-consumer/run.bat (windows 脚本）  

# 4. 查看演示效果  
a）consumer 通过 pipy service 作为服务网关 访问 producer 服务，实现了负载均衡  
<img width="689" alt="image" src="https://github.com/wanpf/pipy-eureka-demo/assets/2276200/9d9b43c8-b3e8-48bb-9b36-6fe287efbcd9">  
b）consumer 通过 pipy service 作为服务网关 访问 producer 服务，实现了限流
<img width="678" alt="image" src="https://github.com/wanpf/pipy-eureka-demo/assets/2276200/4c641838-7144-4729-919d-83c57dc6dba5">  
<img width="789" alt="image" src="https://github.com/wanpf/pipy-eureka-demo/assets/2276200/9c4c7a02-290e-4ff5-96d2-7e7bb1936a32">

# 5. 总结  
demo演示了使用 pipy 作为spring cloud的微服务网关，提供了服务治理能力  
实现了服务的负载均衡、访问限流  
