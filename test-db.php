<?php
$host = 'apiv.gatherly.com.ng';
$db   = 'uxxogqnd_gatherly_db';
$user = 'uxxogqnd_brainiacog';
$pass = 'XhBdAn;}joZig7.K';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    echo "Connected successfully to remote database!";
} catch (PDOException $e) {
    echo "Connection failed: " . $e->getMessage();
}
