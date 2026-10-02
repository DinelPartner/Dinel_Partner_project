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

// Check if data is valid
if (!$data || !isset($data['name']) || !isset($data['email']) || !isset($data['message']) || !isset($data['token'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Missing required fields"]);
    exit;
}

// reCAPTCHA verification
$recaptcha_secret = '6LfNTEUsAAAAAI-CLR5Sp7rNdZKS0CIbYYNjaUJN';
$recaptcha_response = $data['token'];
$verify_url = "https://www.google.com/recaptcha/api/siteverify?secret={$recaptcha_secret}&response={$recaptcha_response}";

$verify_response = file_get_contents($verify_url);
$response_keys = json_decode($verify_response, true);

if (!$response_keys["success"]) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "reCAPTCHA verification failed"]);
    exit;
}

// Sanitize input
$name = filter_var($data['name'], FILTER_SANITIZE_STRING);
$email = filter_var($data['email'], FILTER_SANITIZE_EMAIL);
$phone = isset($data['phone']) ? filter_var($data['phone'], FILTER_SANITIZE_STRING) : '';
$message = filter_var($data['message'], FILTER_SANITIZE_STRING);

// Email configuration
$to = "info@dinelpartner.se"; // DESTINATION EMAIL
$subject = "Ny förfrågan från $name (via webbplatsen)";
$headers = "From: noreply@dinelpartner.se\r\n";
$headers .= "Reply-To: $email\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

$email_content = "Namn: $name\n";
$email_content .= "Email: $email\n";
$email_content .= "Telefon: $phone\n\n";
$email_content .= "Meddelande:\n$message\n";

// Send email
if (mail($to, $subject, $email_content, $headers)) {
    echo json_encode(["status" => "success", "message" => "Email sent successfully"]);
} else {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Failed to send email"]);
}
?>