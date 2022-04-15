<?php
// Answer for Amo
use App\WebhookStatuses;

set_time_limit(1000);
ignore_user_abort(true);
ob_start();
echo str_pad('',1024);
$length = ob_get_length();
header('Status: 200 Ok');
header('Connection: close');
header("Content-Length: " . $length);
header("Content-Encoding: none");
header("Accept-Ranges: bytes");
ob_end_flush();
@ob_flush();
flush();

require __DIR__ .'/../vendor/autoload.php';

header('Content-Type: application/json;charset=utf-8');

try {
    $data = $_POST ? $_POST : json_decode(file_get_contents('php://input'), true);

    if (!$data) {
        throw new \Exception('Data is empty');
    }

    file_put_contents(__DIR__ . '/../logs/webhook.txt',date("Y-m-d H:i:s") . "\n" . "\n" . var_export($data, true). "\n\n", FILE_APPEND);

    // Если интеграция сложная и в основном завязана на вебхуках. нужно складывать их в базу данных
    /*
     * Примерная структура таблицы webhooks. Эта основа, которую можно расширять в зависимости от условий интеграции
     *   id - int
     *   data - json
     *   status - varchar(25) ['new', 'is_processed', 'success', 'error']
     *   created_at - timestamp
     *   updated_at - timestamp
     *
     */
    $db = new DataBaseRepository();

    $db->createWebhook([
        'status' => WebhookStatuses::NEW,
        'data' => json_encode($data),
        'created_at' => new DateTime()
    ]);

    echo json_encode([
        'code' => 200,
        'success' => true
    ], JSON_PRETTY_PRINT);
    exit();
} catch (\Exception $e) {
    echo json_encode([
        'code' => 500,
        'message' => $e->getMessage()
    ], JSON_PRETTY_PRINT);
    exit();
}