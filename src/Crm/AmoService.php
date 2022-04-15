<?php

namespace App\Crm;

use App\Configs\Config;
use GuzzleHttp\Client;
use libAmo\ClientAmo;
use Symfony\Component\Cache\Adapter\FilesystemAdapter;

class AmoService
{
    /**
     * @var ClientAmo
     */
    public $client;

    public  $cache;

    /**
     * AmoCrmRepository constructor
     */
    public function __construct()
    {
        // Инициализируем кеш
        $this->cache = new FilesystemAdapter('', 0, __DIR__ . '/../../../cache');
        $access_token = $this->cache->getItem('access_token');

        // Если в кеше нет токена
        if (!$access_token->isHit()) {
            // Получаем токен из сервиса авторизации, кешируем его и создаем клиента
            $data = $this->getTokenFromAuthService();
            $access_token->set($data['access_token']);
            $access_token->expiresAfter(3600);
            $this->cache->save($access_token);
            $this->client = $this->createClient($data['access_token']);
        }
        // Если в кеше есть токен, создаем клиента
        if ($this->cache->hasItem('access_token'))
        {
            $token = $this->cache->getItem('access_token')->get();
            $this->client = $this->createClient($token);
        }
    }

    private function getTokenFromAuthService()
    {
        $client = new Client([
            'headers' => [
                'Content-type' => 'application/json',
                'Authorization' => 'Bearer ' . Config::SERVICE_AUTH_ACCESS_TOKEN,
            ],
            'base_uri' => 'https://auth.ingru.ru',
            'verify' => false,
            'decode_content' => false,
            'http_errors' => false,
        ]);

        $result = $client->request('POST', '/api/get-amo-token', [
            'json' => [
                'integration_id' => Config::SERVICE_AUTH_INTEGRATION_ID,
            ]
        ]);
        $data = json_decode($result->getBody()->getContents(), true);

        if ($data['code'] === 200) {
            return $data['data'];
        }

        throw new \Exception('Error connect to auth service');
    }

    private function createClient($accessToken)
    {
        $oauthConnect = new OauthConnect(
            Config::AUTH_AMO_SUBDOMAIN,
            Config::AUTH_AMO_LOGIN,
            $accessToken
        );
        return ClientAmo::create($oauthConnect);
    }

    // Метод проверяет авторизацию в амо
    public function checkAuth()
    {
        try {
            // Запрашиваем аккаунт
            $response = $this->client->request->getRequest('/api/v4/account');
            // если в ответ пришел статус 401
            if (isset($response['status']) && $response['status'] === 401) {
                // берем из кеша объект токена
                $access_token = $this->cache->getItem('access_token');
                // Получаем новый токен из сервиса авторизации, кешируем его и создаем клиента
                $data = $this->getTokenFromAuthService();
                $access_token->set($data['access_token']);
                $access_token->expiresAfter(3600);
                $this->cache->save($access_token);
                $this->client = $this->createClient($data['access_token']);
                return true;
            }
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    public function searchContact($phone = null, $email = null)
    {
        if (!$email && !$phone) {
            return null;
        }

        //Search on phone
        if ($phone) {
            $phone = $this->formatPhone($phone);
            if (strlen($phone) === 10) {
                $response = $this->client->request->getRequest('/api/v4/contacts', [
                    'with' => 'leads',
                    'query' => $phone
                ]);

                if (isset($response['_embedded']['contacts'])) {
                    foreach ($response['_embedded']['contacts'] as $user) {
                        foreach ($user['custom_fields_values'] as $custom_field) {
                            if ($custom_field['field_id'] == Config::AMO_CONTACT_PHONE_ID) {
                                foreach ($custom_field['values'] as $value_custom_field) {
                                    if ($this->formatPhone($value_custom_field['value']) == $phone) {
                                        return $user;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        //Search on Email
        if ($email) {
            if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $response = $this->client->request->getRequest('/api/v4/contacts', [
                    'with' => 'leads',
                    'query' => $email
                ]);
                if (isset($response['_embedded']['contacts'])) {
                    foreach ($response['_embedded']['contacts'] as $user) {
                        foreach ($user['custom_fields_values'] as $custom_field) {
                            if ($custom_field['field_id'] == Config::AMO_CONTACT_EMAIL_ID) {
                                foreach ($custom_field['values'] as $value_custom_field) {
                                    if ($value_custom_field['value'] == $email) {
                                        return $user;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return null;
    }

    public function searchLead($leads)
    {
        $leads = array_chunk($leads, 100);
        foreach ($leads as $smallArrayLeads) {
            $searchLeads = [];
            $filter = '';
            foreach ($smallArrayLeads as $key => $lead) {
                $filter .= 'filter[id]['.$key.']='.$lead['id'];
                $searchLeads['id'][] = $lead;
            }
            if (count($searchLeads)) {
                $response = $this->client->request->getRequest('/api/v4/leads?'.$filter, []);
                $response = $response['_embedded']['leads'] ?? null;
                if ($response) {
                    foreach ($response as $item) {
                        if (($item['is_deleted'] == 0) && ($item['status_id'] != 142) && ($item['status_id'] != 143)) {
                            return $item['id'];
                        }
                    }
                }
            }
        }
        return false;
    }

    public function createContact(array $data)
    {
        $response = $this->client->getRequest()->postRequest('/api/v4/contacts', [
            [
                "name" => $data['name'],
                "custom_fields_values" => [
                    [
                        "field_id" => Config::AMO_CONTACT_PHONE_ID,
                        "values" => [
                            [
                                "value" => $data['phone'] ?? ''
                            ]
                        ]
                    ],
                    [
                        "field_id" => Config::AMO_CONTACT_EMAIL_ID,
                        "values" => [
                            [
                                "value" => $data['email'] ?? ''
                            ]
                        ]
                    ]

                ]
            ]
        ]);

        return $response['_embedded']['contacts'][0]['id'] ??  null;
    }

    public function createLead(int $contactID, array $fields)
    {
        $leadAdd = [
            [
                'name' => $fields['title'] ?? '',
                'responsible_user_id' => Config::AMO_RESPONSIBLE_USER_ID,
                'status_id' => Config::AMO_STATUS_ID,
                '_embedded' => [
                    'contacts' => [
                        [
                            'id' => $contactID
                        ]
                    ]
                    /*'tags' => [
                        [
                            'name' => $data['tag']
                        ]
                    ]*/
                ],
                'custom_fields_values' => []
            ]
        ];

        foreach ($fields as $key => $field){
            if ((isset($field)) && (!is_null($field)) && ($field != 'null')) {

                $idFieldAmo = $this->getIdFieldAmo((string) $key);

                if ($idFieldAmo) {
                    array_push($leadAdd[0]['custom_fields_values'], [
                        'field_id' => $idFieldAmo,
                        'values' => [
                            [
                                'value' => $field
                            ]
                        ]
                    ]);
                }

            }
        }

        $response = $this->client->request->postRequest('/api/v4/leads', $leadAdd);
        return  $response['_embedded']['leads'][0]['id'] ?? null;
    }

    public function getResponsibleLead($leadId){
        $response = $this->client->request->getRequest('/api/v4/leads/'.$leadId, []);
        if (isset($response['responsible_user_id'])) {
            return $response['responsible_user_id'];
        }
        return Config::AMO_RESPONSIBLE_USER_ID;
    }

    public function addTaskForLead(int $leadId, $responsibleUser)
    {
        $this->client->request->postRequest('/api/v4/tasks', [
            [
                'entity_id' => $leadId,
                'entity_type' => 'leads',
                'responsible_user_id' => $responsibleUser,
                'complete_till' => time() + 3600, //+1h
                'text' => 'Новая заявка с сайта'
            ]
        ]);
    }

    public function addNoteForLead(int $leadId, string $description = 'Новая заявка с сайта')
    {
        $this->client->request->postRequest('/api/v4/leads/notes', [
            [
                'entity_id' => $leadId,
                'note_type' => 'common',
                'params' => [
                    'text' => $description
                ]
            ]
        ]);
    }

    public function addNewPhoneOrEmail($contact, $phone = null, $email = null)
    {
        $customFieldEmail = [];
        $customFieldPhone = [];
        if (isset($contact['custom_fields_values']) && !empty($contact['custom_fields_values'])) {
            foreach($contact['custom_fields_values'] as &$customField) {
                // Проверяем существует ли телефон у контакта
                if ($customField['field_id'] === Config::AMO_CONTACT_PHONE_ID) {
                    $customFieldPhone = [
                        'field_id' => $customField['field_id'],
                        'values' => []
                    ];
                    $issetPhone = false;
                    foreach ($customField['values'] as $item) {
                        // Проверяем найденные телефоны с телефоном клиента из виджета
                        if ($this->formatPhone($item['value']) == $this->formatPhone($phone)) {
                            $issetPhone = true;
                        }
                        unset ($item['enum_id']);
                        $customFieldPhone['values'][] = $item;
                    }
                    // если совпадений нет, добавляем в массив новый телефон
                    if (!$issetPhone) {
                        $customFieldPhone['values'][] = [
                            'value' => $phone ?? '',
                            'enum_code' => 'WORK'
                        ];
                    }
                }
                // Проверяем существует ли emial у контакта
                if ($customField['field_id'] === Config::AMO_CONTACT_EMAIL_ID) {
                    $customFieldEmail = [
                        'field_id' => $customField['field_id'],
                        'values' => []
                    ];
                    $issetEmail = false;
                    foreach ($customField['values'] as $item) {
                        // Проверяем найденные email с email клиента из виджета
                        if ($item['value'] == $email) {
                            $issetEmail = true;
                        }
                        unset ($item['enum_id']);
                        $customFieldEmail['values'][] = $item;
                    }
                    // если совпадений нет, добавляем в массив новый email
                    if (!$issetEmail) {
                        $customFieldEmail['values'][] = [
                            'value' => $email ?? '',
                            'enum_code' => 'WORK'
                        ];
                    }
                }
            }
            // если есть телефон из виджета, и мы не нашли не каких телефонов у контакта, до добавляем их
            if ($phone && empty($customFieldPhone)) {
                $customFieldPhone =  [
                    'field_id' => Config::AMO_CONTACT_PHONE_ID,
                    'values' => [
                        [
                            'value' => $phone ?? '',
                            'enum_code' => 'WORK'
                        ]
                    ]
                ];
            }
            // если есть email из виджета, и мы не нашли не каких email у контакта, до добавляем их
            if ($email && empty($customFieldEmail)) {
                $customFieldEmail = [
                    'field_id' => Config::AMO_CONTACT_EMAIL_ID,
                    'values' => [
                        [
                            'value' => $email ?? '',
                            'enum_code' => 'WORK'
                        ]
                    ]
                ];
            }
        }

        $this->client->getRequest()->patchRequest('/api/v4/contacts/' . $contact['id'],
            [
                'id' => (int)$contact['id'],
                'custom_fields_values' => [$customFieldEmail, $customFieldPhone]
            ]
        );
        return true;
    }

    private function formatPhone($phone)
    {
        if ($phone) {
            $phone = preg_replace("/[^0-9]/", '', $phone); //режем всё кроме цифр
            $phone = substr($phone, -10);    //последние 10 цифр
            return $phone;
        }
        return null;
    }

    private function getIdFieldAmo(string $fieldName) :int
    {
        switch ($fieldName) {
            case 'linkPage':
                $amo_field_id = Config::AMO_FIELD_LINK_PAGE;
                break;
            case 'title':
                $amo_field_id = Config::AMO_FIELD_TITLE;
                break;
            case 'utm_source':
                $amo_field_id = Config::AMO_FIELD_UTM_SOURCE;
                break;
            case 'utm_medium':
                $amo_field_id = Config::AMO_FIELD_UTM_MEDIUM;
                break;
            case 'utm_campaign':
                $amo_field_id = Config::AMO_FIELD_UTM_CAMPAIGN;
                break;
            case 'utm_content':
                $amo_field_id = Config::AMO_FIELD_UTM_CONTENT;
                break;
            case 'utm_term':
                $amo_field_id = Config::AMO_FIELD_UTM_TERM;
                break;

            default:
                $amo_field_id = null;
                break;
        }
        return $amo_field_id;
    }
}
