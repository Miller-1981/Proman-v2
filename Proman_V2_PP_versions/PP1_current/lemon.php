<?php
// Version 19-11-22 18:00
const API_URL = 'https://sendmelead.com/api/v3/lead/add';
const OFFER_ID = 'df763e6d-2dbe-4fd0-9c8c-b06d0004f5c2'; // ID of selected offer
const WEBMASTER_TOKEN = 'c687afc3a8da844eb528c9470e2e2319'; // Token from Your profile
const NAME_FIELD = 'name'; // What is the name of field on the landing with name/full name
const PHONE_FIELD = 'phone'; // Name of the field with phone number
const COST = 49000;

// The fields below should be redirected back to the landing
// Where to redirect if this is not a post request with a form
$urlForNotPost = 'index.html';
// Where to redirect if fields for name or phone number are not filled
$urlForEmptyRequiredFields = 'index.html';
// Where to redirect if the server replied with something incomprehensible
$urlForNotJson = 'index.html';
// Where to redirect if everything is OK
$urlSuccess = 'success.php';

//------------------------------- It is undesirable to make changes further -----------------------------------------------------


function writeToLog(array $data, $response) {
    $log  = date("F j, Y, g:i a").PHP_EOL.
        "----------- DATA -------------".PHP_EOL.
        print_r($data, true) .PHP_EOL.
        "----------- RESPONSE ---------".PHP_EOL.
        $response .PHP_EOL.
        "----------- END --------------".PHP_EOL;

    file_put_contents('./log_'.date("j.n.Y").'.log', $log, FILE_APPEND);
}
function getUserIP() {
    // Get real visitor IP behind CloudFlare network
    if (isset($_SERVER["HTTP_CF_CONNECTING_IP"])) {
        $_SERVER['REMOTE_ADDR'] = $_SERVER["HTTP_CF_CONNECTING_IP"];
        $_SERVER['HTTP_CLIENT_IP'] = $_SERVER["HTTP_CF_CONNECTING_IP"];
    }
    $client  = @$_SERVER['HTTP_CLIENT_IP'];
    $forward = @$_SERVER['HTTP_X_FORWARDED_FOR'];
    $remote  = $_SERVER['REMOTE_ADDR'];

    if (filter_var($client, FILTER_VALIDATE_IP)) {
        $ip = $client;
    } elseif (filter_var($forward, FILTER_VALIDATE_IP)) {
        $ip = $forward;
    } else {
        $ip = $remote;
    }

    return $ip;
}

// Checks
$isCurlEnabled = function(){
    return function_exists('curl_version');
};

if (!$isCurlEnabled()) {
    echo "<pre>";
    echo "pls install curl\n";
    echo "For *unix open terminal and type this:\n";
    echo 'sudo apt-get install curl && apt-get install php-curl';
    die;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: '.$urlForNotPost);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Check if the fields are not filled in reject and do not send anything
    if (empty($_POST[NAME_FIELD]) || empty($_POST[PHONE_FIELD])) {
        header('Location: '.$urlForEmptyRequiredFields);
        exit;
    }

    $args = array(
	'name' => $_POST[NAME_FIELD],
	'phone' => $_POST[PHONE_FIELD],

        'offerId' => OFFER_ID,
        'domain' => "http://" . $_SERVER["HTTP_HOST"] . $_SERVER["REQUEST_URI"],
        'ip' => getUserIp(),
        'utm_campaign' => key_exists('utm_campaign', $_POST) ? $_POST['utm_campaign'] : null,
        'utm_content' => key_exists('utm_content', $_POST) ? $_POST['utm_content'] : null,
        'utm_medium' => key_exists('utm_medium', $_POST) ? $_POST['utm_medium'] : null,
        'utm_source' => key_exists('utm_source', $_POST) ? $_POST['utm_source'] : null,
        'utm_term' => key_exists('utm_term', $_POST) ? $_POST['utm_term'] : null,
        'clickid' => key_exists('clickid', $_POST) ? $_POST['clickid'] : null,
		'fbpxl' => key_exists('fbpxl', $_POST) ? $_POST['fbpxl'] : null,
		'cost' => COST,

    );

    $data = json_encode($args);
    $curl = curl_init();
    curl_setopt_array($curl, array(
        CURLOPT_URL => API_URL,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $data,
        CURLOPT_HTTPHEADER => array(
            'Content-Type: application/json',
            'Content-Length: ' . strlen($data),
            'X-Token: '.WEBMASTER_TOKEN,
        ),
    ));

    $result = curl_exec($curl);
    curl_close($curl);
    writeToLog($args, $result);

    $result = json_decode($result, true);

    if ($result === null) {
        header('Location: '.$urlForNotJson);
        exit;
    } else {
        $parameters = [
            'fbpxl' => $args['fbpxl'],
            'name' => $args['name'],
            'phone' => $args['phone']
        ];

        $urlSuccess .= '?' . http_build_query($parameters);

        header('Location: '.$urlSuccess);
        exit;
    }
}
?>
