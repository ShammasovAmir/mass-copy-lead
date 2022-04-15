<?php
namespace App\Helpers;

class FormHelper
{

    public static function validDataForm(array $contact) : bool {

        if (!(isset($contact['phone']) || isset($contact['email']))) {
            return true;
        }

        return false;
    }

    public static function getNameContactForm(array $contact) : string {

        if (!isset($contact['name'])) {
            if (!isset($contact['phone'])) {
                $contact['name'] = $contact['phone'];
            } elseif (!isset($contact['email'])) {
                $contact['name'] = $contact['email'];
            }
        }

        return $contact['name'];
    }

    public static function createDescriptionForm(array $params) : string {
        $description = '';

        foreach ($params as $param){
            foreach ($param as $value){
                $description .= (isset($value)) ? trim($value)."\n" : '';
            }
        }

        return $description;
    }

}