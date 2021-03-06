<?php

$config->CM_Mail->send = false;

$config->CM_Elasticsearch_Client->enabled = false;

$config->CM_Db_Db->db = $config->CM_Db_Db->db . '_test';
$config->CM_Db_Db->serversReadEnabled = false;
$config->CM_Db_Db->delayedEnabled = false;

$config->classConfigCacheEnabled = false;

$config->CM_Model_Splittest->withoutPersistence = true;

$config->CM_Model_Splitfeature->withoutPersistence = true;

$config->CM_Jobdistribution_Job_Abstract->gearmanEnabled = false;

$config->services['filesystemData'] = array(
    'class'     => 'CM_Service_Filesystem',
    'arguments' => array(
        'CM_File_Filesystem_Adapter_Local',
        array(
            'pathPrefix' => DIR_ROOT . 'tests/tmp/data/',
        ),
    ),
);

$config->services['filesystemUserfiles'] = array(
    'class'     => 'CM_Service_Filesystem',
    'arguments' => array(
        'CM_File_Filesystem_Adapter_Local',
        array(
            'pathPrefix' => DIR_ROOT . 'tests/tmp/userfiles/',
        ),
    ),
);
