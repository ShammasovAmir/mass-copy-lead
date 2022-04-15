<?php

declare(strict_types=1);


class DataBaseRepository
{
    private $db;

    public function __construct()
    {
        $this->db = new Nette\Database\Connection('mysql:host=127.0.0.1;dbname=' . getenv('DB_NAME'), getenv('DB_USER'), getenv('DB_PASSWORD'));
    }

    public function createWebhook($data)
    {
        $this->db->query('INSERT INTO webhooks', $data);
    }
}