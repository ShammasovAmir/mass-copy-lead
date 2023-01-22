Панель продуктов
=============================

Установка
------------

Команды для запуска проекта:
-----------
    Скопировать .env.example и переименовать в .env
    
    docker-compose build --build-arg uid=$(id -u)               - Собрать окружение           
    docker-compose up -d                                        - Запустить контейнеры
    cd storage/
    mkdir -p framework/{sessions,views,cache}    
    chmod -R 777 framework
    docker-compose exec localproduct composer install                  - Установить зависимости 
    docker-compose run --rm nodejs npm i                        - Установить js зависимости 
    docker-compose run --rm nodejs npm run dev                  - Сборка ресурсов 
    docker-compose exec localproduct php artisan migrate               - Накатить миграции
    docker-compose exec localproduct php artisan storage:link          - Создание симлинка для публичного доступа к файлам, хранимым в storage/app/public

Команды
-----------
    sudo chown -R 1000:1000 database/migrations                             - Дать права на папку
    docker-compose run --rm nodejs npm run dev                              - Собрать ресурсы и запустить watch    
    docker-compose exec localproduct php artisan migrate                           - Накатить миграции
    docker-compose exec localproduct php artisan make:migration <name migration>   - Создать новую миграцию

Редис
----------- 
    docker-compose exec redis redis-cli                                     - Войти в консоль редис        
    auth dev                                                                - Авторизоваться в redis
    docker-compose exec localproduct php artisan job:execute > /dev/null &         - Запуск демона для выполнения заданий из очереди execute:
    docker-compose exec -T localproduct sh scripts/restart_jobs_deamon.sh          - Убить и перезапустить процессы заданий -  скрипт для локалки


Хосты
-----------
Сгенерировать сертификат

    127.0.0.1 localproduct.local.dv
