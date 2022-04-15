<?php

use App\Crm\AmoService;
use App\Helpers\FormHelper;

require __DIR__ .'/../vendor/autoload.php';

header('Content-Type: application/json;charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode([
        'name' => 'Имя',
        'email' => 'Почта из формы',
        'phone' => 'Телефон из формы',
        'linkPage' => 'Ссылка на страницу отправки формы',
        'title' => 'Название формы',
        'utm_source' => 'Данные маркетинга',
        'utm_medium' => 'Данные маркетинга',
        'utm_campaign' => 'Данные маркетинга',
        'utm_content' => 'Данные маркетинга',
        'utm_term' => 'Данные маркетинга',
        'payment' => 'Вариант оплаты',
        'delivery' => 'Способ доставки',
        'address' => 'Адрес доставки',
        'company' => 'Название компании',
        'product' => 'Товары',
        'file' => 'Ccылка на Файл',
        'text' => 'Комментарий'
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit();
}

try {
    $data = $_POST ? $_POST : json_decode(file_get_contents('php://input'), true);

    if (!$data) {
        throw new \Exception('Data is empty');
    }

    file_put_contents(__DIR__.'/../logs/site/data.txt',date("Y-m-d H:i:s") . "\n" . "\n" . var_export($data, true). "\n\n", FILE_APPEND);
    $amoService = new AmoService();

    // Проверка на авторизацию в амоCRM
    if (!$amoService->checkAuth()) {
        throw new \Exception('Error connect to amo');
    }
    // Далее идет логика по приему данных, все методы по работе с данными должны быть реализованы в AmoService
    // В скрипте мы описываем основные бизнес условия интеграции
    $site['contact']['name'] = (isset($data['name'])) ? trim($data['name']) : null;
    $site['contact']['phone'] = (isset($data['phone'])) ? trim($data['phone']) : null;
    $site['contact']['email'] = (isset($data['email'])) ? trim($data['email']) : null;
    $site['lead']['linkPage'] = (isset($data['linkPage'])) ? trim($data['linkPage']) : null;
    $site['lead']['title'] = (isset($data['title'])) ? trim($data['title']) : null;
    $site['lead']['utm_source'] = (isset($data['utm_source'])) ? trim($data['utm_source']) : null;
    $site['lead']['utm_medium'] = (isset($data['utm_medium'])) ? trim($data['utm_medium']) : null;
    $site['lead']['utm_campaign'] = (isset($data['utm_campaign'])) ? trim($data['utm_campaign']) : null;
    $site['lead']['utm_content'] = (isset($data['utm_content'])) ? trim($data['utm_content']) : null;
    $site['lead']['utm_term'] = (isset($data['utm_term'])) ? trim($data['utm_term']) : null;
    $site['note']['payment'] = (isset($data['payment'])) ? trim($data['payment']) : null;
    $site['note']['delivery'] = (isset($data['delivery'])) ? trim($data['delivery']) : null;
    $site['note']['address'] = (isset($data['address'])) ? trim($data['address']) : null;
    $site['note']['product'] = (isset($data['product'])) ? trim($data['product']) : null;
    $site['note']['file'] = (isset($data['file'])) ? trim($data['file']) : null;
    $site['note']['text'] = (isset($data['text'])) ? trim($data['text']) : null;
    $site['company']['company'] = (isset($data['company'])) ? trim($data['company']) : null;


    // Проверяем наличие Phone или Email в заявке
    if (FormHelper::validDataForm($site['contact'])) {
        throw new \Exception('Data is not valid');
    }

    //Если имя неуказано заменяем номером телефона или email
    $site['contact']['name'] = FormHelper::getNameContactForm($site['contact']);

    // Создаём описание для примечания
    $descriptionForm = FormHelper::createDescriptionForm($site);

    // Ищем контакт по данным из заявки (phone/email)
    $contact = $amoService->searchContact($site['contact']['phone'], $site['contact']['email']);

    //echo '<pre>'; print_r($site); echo '</pre>'; die('check _POST data!');
    // Если нашли контакт в amoCRM
    if ($contact) {
        // Проверить пришедшие телефон и email и добавить не существующие к контакту
        $amoService->addNewPhoneOrEmail($contact, $site['contact']['phone'], $site['contact']['email']);

        // Проверяем наличие активных сделок у контакта
        if (isset($contact['_embedded']['leads']) && $contact['_embedded']['leads']) {
            // Получаем Id активной сделки
            $leadId = $amoService->searchLead($contact['_embedded']['leads']);

            //Если не нашли активную сделку создаём её
            if (!$leadId){
                $leadId = $amoService->createLead((int) $contact['id'], (array) $site['lead']);
            }
        } else {
            //Если не нашли активную сделку создаём её
            $leadId = $amoService->createLead((int) $contact['id'], (array) $site['lead']);
        }
    }
    // Если контакта нет в amoCRM
    else {
        // Cоздаем контакт
        $contactId = $amoService->createContact($site['contact']);
        // Cоздаем сделку
        $leadId = $amoService->createLead((int) $contactId, (array) $site['lead']);
    }

    // Если мы успешно нашли или создали сделку в amoCRM, то прикрепляем к ней задачу и примичание
    if (isset($leadId)){
        $responsibleUser = $amoService->getResponsibleLead($leadId);

        $amoService->addTaskForLead((int) $leadId, $responsibleUser);
        $amoService->addNoteForLead((int) $leadId, $descriptionForm);
    }

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
}