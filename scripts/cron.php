<?php

use App\Crm\AmoService;
use App\Env;

const LOCK = __DIR__ .'/lock_cron_processing';

if (php_sapi_name() !== 'cli') {
    die;
}

require __DIR__ .'/../vendor/autoload.php';

$env = new Env();

// Этот код удаляет блокирующий файл, после завершения работы скрипта
if (!file_exists(LOCK)) {
    register_shutdown_function('unlink', LOCK);
}
if (!getLockFile(LOCK)) {
    try {
        // Именно здесь начинаем инициализацию
        $amoService = new AmoService();
        $db = new Nette\Database\Connection('mysql:host=127.0.0.1;dbname=' . getenv('DB_NAME'), getenv('DB_USER'), getenv('DB_PASSWORD'));
        // Проверка на авторизацию в амоCRM
        if (!$amoService->checkAuth()) {
            throw new \Exception('Error connect to amo');
        }
        // Пишем логику
    } catch (\Exception $e) {
    }
}

// Функция если файл не существует создаст его иначе вернет сам файл
function getLockFile($name)
{
    if (!file_exists($name)) {
        $file = fopen($name, "w");
        file_put_contents($name, time());
        return false;
    }
    $file = file_get_contents($name);
    return $file;
}