<?php

namespace App\Crm;

use libAmo\ConnectInterface;
use libAmo\ParamsInterface;

class OauthConnect implements ConnectInterface
{
    private $domain;
    private $login;
    private $access_token;

    /**
     * ApiKeyConnect constructor.
     * @param $domain
     * @param $login
     * @param $access_token
     */
    public function __construct($domain, $login, $access_token)
    {
        $this->domain = $domain;
        $this->login = $login;
        $this->access_token = $access_token;
    }

    public function setParams(ParamsInterface $params): ParamsInterface
    {
        // Разернуть поддомен в полный домен
        if (strpos($this->domain, '.') === false) {
            $domain = sprintf('%s.amocrm.ru', $this->domain);
        }

        $params->addDomain($domain);
        $params->addLogin($this->login);
        $params->addAccessToken($this->access_token);

        return $params;
    }

}
