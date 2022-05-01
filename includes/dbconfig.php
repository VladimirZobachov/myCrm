<?php

global $db_engine, $db_conn;
$db_engine = "mysqli";

$local_names = array("localhost", "127.0.0.1", "parsers");
if( in_array($_SERVER['SERVER_NAME'], $local_names) ){
    $db_host = "localhost";
    $db_user = "root";
    $db_pass = "";
    $db_name = "firmaacru_crm";
}else{
    $db_host = "localhost";
    $db_user = "root";
    $db_pass = "";
    $db_name = "firmaacru_crm";
}


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
      @mysql_query( 'SET character_set_connection=utf8;') or die("Error: could not set connection");
}

?>
