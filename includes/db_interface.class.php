<?php

include_once( "dbconfig.php" );


class DBInterface{


      public static function query( $sql ){
            global $db_conn, $db_engine;
            if( $db_engine == "mysql" ){
                  self::reconnect();
                  $resource = mysql_query( $sql );
                  if( mysql_error() AND strpos(mysql_error(), "MySQL server has gone away") === FALSE &&
                    strpos(mysql_error(), "A link to the server could not be established") === FALSE ){
                        die("Error: ". mysql_error() ." . SQL:\n". $sql );
                  }elseif( mysql_error() AND strpos(mysql_error(), "MySQL server has gone away") !== FALSE ||
                    strpos(mysql_error(), "A link to the server could not be established") !== FALSE ){
                        self::reconnect();
                        return self::query( $sql );
                  }elseif( mysql_error() ){
                        echo "Error: ". mysql_error() ."<br>\nIn SQL: ". $sql;
                        die;
                  }
            }elseif( $db_engine == "mysqli" ){
                  $resource = mysqli_query( $db_conn, $sql );
                  if( !$resource ){
                        die("Error: ". mysqli_errno($db_conn) .": ". mysqli_error($db_conn) ." . SQL:\n". $sql );
                  }
            }
            return $resource;
      }
      
      
      public static function reconnect(){
            global $db_conn, $db_engine;
            if( strpos(mysql_error(), "MySQL server has gone away") !== FALSE ){
                  mysql_close();
                  include( "dbconfig.php" );
            }
      }
      
      
      public static function getError(){
            global $db_conn, $db_engine;
            if( $db_engine == "mysql" ){
                return mysql_error();
            }elseif( $db_engine == "mysqli" ){
                return mysqli_error($db_conn);
            }
      }


      public static function fetchArray( $resource ){
            global $db_engine;
            if( $db_engine == "mysql" ){
                  return mysql_fetch_array( $resource );
            }elseif( $db_engine == "mysqli" ){
                  return mysqli_fetch_array( $resource );
            }
      }


      public static function fetchRow( $resource ){
            global $db_engine;
            if( $db_engine == "mysql" ){
                  return mysql_fetch_row( $resource );
            }elseif( $db_engine == "mysqli" ){
                  return mysqli_fetch_row( $resource );
            }
      }


      public static function escapeString( $string ){
            global $db_conn, $db_engine;
            if( $db_engine == "mysql" ){
                  return mysql_real_escape_string( $string );
            }elseif( $db_engine == "mysqli" ){
                  return mysqli_real_escape_string( $db_conn, $string );
            }
      }
      
      
      public static function numRows( $resource ){
            global $db_conn, $db_engine;
            if( $db_engine == "mysql" ){
                  return mysql_num_rows( $resource );
            }elseif( $db_engine == "mysqli" ){
                  return mysqli_num_rows( $resource );
            }
      }
      
      
      public static function affectedRows( $resource ){
            global $db_conn, $db_engine;
            if( $db_engine == "mysql" ){
                  return mysql_affected_rows( $resource );
            }elseif( $db_engine == "mysqli" ){
                  return mysqli_affected_rows( $resource );
            }
      }


      public static function insert( $t_name, $fields, $data ){
            $sql = "INSERT INTO `". self::escapeString($t_name) ."`\n";
            for( $i=0; $i < count($fields); $i++ ) $fields[$i] = "`". $fields[$i] ."`";
            $sql .= "\t(". implode(", ", $fields) .") VALUES\n";
            $c = count($data);$k = 1;
            foreach( $data as $item ){
                  $sql .= "\t(";
                  for( $i=0; $i < count($item); $i++ ){
                    $item[$i] = is_array($item[$i]) && $item[$i][1] == "func" ? DBInterface::escapeString($item[$i][0]) :
                            "'". DBInterface::escapeString($item[$i]) ."'";
                  }
                  $sql .= implode( ", ", $item ) .")";
                  if( $c != $k ) $sql .= ",";
                  $sql .= "\n";
                  $k += 1;
            }
            $sql .= ";";
            self::query( $sql );
            return self::insertId();
      }
      
      
      public static function insertSQL( $sql ){
            self::query( $sql );
            return self::insertId();
      }


      public static function insertId(){
            global $db_conn, $db_engine;
            if( $db_engine == "mysql" ){
                  return mysql_insert_id();
            }elseif( $db_engine == "mysqli" ){
                  return mysqli_insert_id( $db_conn );
            }
      }


      public static function update( $t_name, $set, $where ){
            if( !$set OR !$t_name OR !$where ) return;
            $sql = "UPDATE `". self::escapeString($t_name) ."` SET\n";
            $c = count($set);$i = 1;
            foreach( $set as $k=>$v ){
                  $sql .= "`". self::escapeString($k) ."` = '". self::escapeString($v) ."'";
                  if( $i != $c ) $sql .= ",";
                  $sql .= "\n";
                  $i += 1;
            }
            $sql .= " WHERE ". $where .";";
//             var_dump( $sql );die;
            self::query( $sql );
            return TRUE;
      }


      public static function selectAndFetchRowsAssoc( $sql ){
            $res = self::query( $sql );
            $rows = array();
            while( $row = self::fetchArray($res) ) $rows[] = $row;
            return $rows;
      }


      public static function selectAndFetchRows( $sql ){
            $res = self::query( $sql );
            $rows = array();
            while( $row = self::fetchRow($res) ) $rows[] = $row;
            return $rows;
      }
      
      public static function selectAndFetchRowAssoc( $sql ){
            $res = self::query( $sql );
            $row = self::fetchArray($res);
            return $row;
      }
      
      
      public static function selectAndFetchRow( $sql ){
            $res = self::query( $sql );
            $row = self::fetchRow($res);
            return $row;
      }
      
      
      public static function close(){
            global $db_conn, $db_engine, $db_conn_mysql;
            if( $db_engine == "mysql" ){
                @mysql_close( $db_conn_mysql );
            }elseif( $db_engine == "mysqli" ){
                mysqli_close( $db_conn );
            }
      }
}


class DBInterfaceObject{

    function __construct(){
    }
    
    
    public static function getInstance(){
        return new DBObject;
    }
    
    
    function get_row_assoc( $sql ){
        return DBInterface::selectAndFetchRowAssoc( $sql );
    }
    
    
    function get_row( $sql ){
        return DBInterface::selectAndFetchRow( $sql );
    }
    
    
    function get_rows( $sql ){
        return DBInterface::selectAndFetchRows( $sql );
    }
    
    
    function get_rows_assoc( $sql ){
        return DBInterface::selectAndFetchRowsAssoc( $sql );
    }
    
    
    function query( $sql ){
        return DBInterface::query( $sql );
    }
    
    
    function escape( $string ){
        return DBInterface::escapeString( $string );
    }
    
    
    function insert( $table, $fields, $values ){   
        return DBInterface::insert( $table, $fields, $values );
    }
    
    
    function update( $table, $set, $where ){
        return DBInterface::update( $table, $set, $where );
    }
    
    
    function fetch_row( $resource ){
        return DBInterface::fetchRow( $resource );
    }
    
    
    function fetch_array( $resource ){
        return DBInterface::fetchArray( $resource );
    }
    
    
    function insert_id(){
        return DBInterface::insertId();
    }
    
    
    function num_rows( $resource ){
        return DBInterface::numRows( $resource );
    }
    
    
    function get_error(){
        return DBInterface::getError();
    }
    
}


?>
