<?php

global $db_engine, $db_conn;
$db_engine = "mysqli";

// Поддержка Docker (переменные окружения) и локальной разработки
$db_host = getenv("DB_HOST") ?: "localhost";
$db_user = getenv("DB_USER") ?: "root";
$db_pass = getenv("DB_PASS") ?: "";
$db_name = getenv("DB_NAME") ?: "firmaacru_crm";

if( $db_engine == "mysqli" ){
      $db_conn = mysqli_connect($db_host, $db_user, $db_pass) or die("Could not connect to db");
      mysqli_select_db( $db_conn, $db_name) or die("Could not select the database");
      @mysqli_query( $db_conn, 'SET NAMES utf8;') or die("Error: could not set names");
      @mysqli_query( $db_conn, 'SET CHARACTER SET utf8;') or die("Error: could not set character");
      @mysqli_query( $db_conn, 'SET character_set_connection=utf8;') or die("Error: could not set connection");
}else{
      mysql_connect($db_host, $db_user, $db_pass) or die("Could not connect to db");
      mysql_select_db( $db_name) or die("Could not select the database");
      @mysql_query( 'SET NAMES utf8;') or die("Error: could not set names");
      @mysql_query( 'SET CHARACTER SET utf8;') or die("Error: could not set character");

}
