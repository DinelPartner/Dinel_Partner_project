<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method Not Allowed"]);
    exit;
}

// Get JSON input
$data = json_decode(file_get_contents("php://input"), true);

// Basic validation
if (!$data) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid payload"]);
    exit;
}

// Sanitize inputs
$isHomeowner = filter_var($data['isHomeowner'] ?? '', FILTER_SANITIZE_STRING);
$location = filter_var($data['location'] ?? '', FILTER_SANITIZE_STRING);
$name = filter_var($data['name'] ?? '', FILTER_SANITIZE_STRING);
$phone = filter_var($data['phone'] ?? '', FILTER_SANITIZE_STRING);
$email = filter_var($data['email'] ?? '', FILTER_SANITIZE_EMAIL);
$message = filter_var($data['message'] ?? '', FILTER_SANITIZE_STRING);

// Validate required fields (backend double-check)
if (!$isHomeowner || !$location || !$name || (!$phone && !$email)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Saknade obligatoriska fält"]);
    exit;
}

// Email configuration
$to = "info@dinelpartner.se";
$subject = "Ny förfrågan om klimatanläggning från $name (/offert-klimat)";

// Headers
$headers = "From: noreply@dinelpartner.se\r\n";
if ($email) {
    $headers .= "Reply-To: $email\r\n";
}
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

// Email Body
$email_content = "Ny offertförfrågan (klimatanläggning) mottagen:\n\n";
$email_content .= "Datum: " . date("Y-m-d H:i:s") . "\n";
$email_content .= "----------------------------------\n";
$email_content .= "Är bostadsägare: $isHomeowner\n";
$email_content .= "Ort/Stadsdel: $location\n\n";
$email_content .= "Namn: $name\n";
$email_content .= "Telefon: $phone\n";
$email_content .= "E-post: $email\n\n";
$email_content .= "Meddelande:\n$message\n";
$email_content .= "----------------------------------\n";
$email_content .= "Källa: /offert-klimat\n";

// Attempt to send
if (mail($to, $subject, $email_content, $headers)) {
    echo json_encode(["status" => "success", "message" => "Offertförfrågan skickad"]);
} else {
    // Log error if possible or just return 500
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Kunde inte skicka mailet"]);
}
?>
