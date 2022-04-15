<?php

namespace App;

use Dotenv\Dotenv;

class Env
{
    private $dotenv;

    public function __construct()
    {
        $this->dotenv = Dotenv::createImmutable(__DIR__.'/..');
        $this->dotenv->load();
    }
}