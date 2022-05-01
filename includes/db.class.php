<?php


include_once( DOCROOT ."includes/db_interface.class.php" );


class DB extends DBInterfaceObject{


    function clearOldSessions()
    {
        $old = time() - 86400;
        $this->query( "DELETE FROM `sessions` WHERE `time` < '". $old ."';" );
    }


    function getUserInfoBySessid( $sessid )
    {
        return $this->get_row_assoc( "SELECT `u`.* FROM `sessions` AS `s`
            INNER JOIN `users` AS `u` ON `u`.`id` = `s`.`user_id`
            WHERE `sessid` = '". $this->escape($sessid) ."';" );
        ;
    }


    function getRows( $user_id, $user_type, $page, $sort_by="id", $sort_how="ASC", $archived=0 )
    {
        $limit = 50;
        $start = $page * $limit - $limit;
        $sql = "SELECT `orders`.*, `users`.`fio` AS `fio` FROM `orders` LEFT JOIN `users` ON `users`.`id` = `orders`.`created_by`";
        $sql_c = "SELECT COUNT(*) AS `c` FROM `orders` ";
        $sql .= " WHERE `orders`.`is_archived` = '". (int)$archived ."' ";
        $sql_c .= " WHERE `orders`.`is_archived` = '". (int)$archived ."' ";
        if( $user_type == 2 )
        {
            $sql .= " AND `orders`.`created_by` = '". (int)$user_id ."'";
            $sql_c .= " AND `orders`.`created_by` = '". (int)$user_id ."'";
        }elseif( $user_type == 3 )
        {
            $sql .= " AND `orders`.`created_for` = '". (int)$user_id ."'";
            $sql_c .= " AND `orders`.`created_for` = '". (int)$user_id ."'";
        }
        $sql .= "ORDER BY `orders`.`". $this->escape($sort_by) ."` ". $this->escape($sort_how) ." LIMIT {$start}, {$limit}";
        $rows = $this->get_rows_assoc( $sql );
        $count = $this->get_row_assoc( $sql_c );
        return array($rows, $count['c']);
    }
    
    
    function insertOrder( $data, $user_id )
    {
        $data['date_create'] = @date("y.m.d H:i:s");
        $data['created_by'] = $user_id;
//         $data['created_for'] = $created_for;
        return $this->insert( "orders", array_keys($data), array(array_values($data)) );
    }
    
    
    function delete( $id )
    {
        $this->query( "DELETE FROM `orders` WHERE `id` = '". (int)$id ."';" );
    }
    
    
    function getUserByLoginData( $login, $passwd )
    {
        $passwd = md5($passwd);
        $result = $this->get_row_assoc( "SELECT * FROM `users` WHERE
            `login` = '". $this->escape($login) ."' AND
            `passwd` = '". $this->escape($passwd) ."'
        ;" );
        return $result;
    }
    
    
    function insertSession( $sessid, $user_id, $time )
    {
        return $this->insert( 
            "sessions",
            array("sessid", "user_id", "time"),
            array(array($sessid, $user_id, $time))
        );
    }
    
    
    function deleteSession( $sessid )
    {
        $this->query( "DELETE FROM `sessions` WHERE `sessid` = '". $this->escape($sessid) ."';" );
    }
    
    
    function getOrderAjax( $id )
    {
        return $this->get_row_assoc( "SELECT * FROM `orders` WHERE `id` = '". (int)$id ."';" );
    }
    
    function getOrder( $id )
    {
        return $this->get_row_assoc( "SELECT * FROM `orders` WHERE `id` = '". (int)$id ."';" );
    }
    
    function updateOrder( $data, $id )
    {
        $this->update( "orders", $data, "`id` = '". (int)$id ."'" );
    }
    
    
    function updateComment( $id, $comment, $for=null, $from=null )
    {
        if( $from == 2 || $from == 3 )
        {
            $field = $from == 3 ? "comments" : "comment_manager";
        }else
        {
            $field = $for == 1 ? "comments" : "comment_manager";
        }
        $this->update( "orders", array("{$field}" => $comment), "`id` = '". (int)$id ."'" );
    }
    
    
    function updateStatus( $id, $status )
    {
        $this->update( "orders", array("status" => $status), "`id` = '". (int)$id ."'" );
    }
    
    
    function insertUser( $info )
    {
        return $this->insert( "users", array_keys($info), array(array_values($info)) );
    }
    
    
    function issetLogin( $login )
    {
        $result = $this->get_row_assoc( "SELECT `id` FROM `users` WHERE `login` = '". $this->escape($login) ."';" );
        return $result['id'];
    }
    
    
    function issetEmail( $email )
    {
        $result = $this->get_row_assoc( "SELECT `id` FROM `users` WHERE `email` = '". $this->escape($email) ."';" );
        return $result['id'];
    }
    
    
    function getManagersForOptions()
    {
        $res = $this->query( "SELECT `id`, `fio` FROM `users` WHERE `type_user` = '2' ORDER BY `fio` ASC;" );
        $rows = array();
        while( $r = $this->fetch_array($res) ) $rows[] = array("name" => $r['fio'], "value" => $r['id']);
        return $rows;
    }
    
    
    function deleteUser($id)
    {
        $this->query( "DELETE FROM `users` WHERE `id` = '". (int)$id ."';" );
    }
    
    
    function getUser($id)
    {
        return $this->get_row_assoc( "SELECT * FROM `users` WHERE `id` = '". (int)$id ."';" );
    }
    
    
    function updateUser( $id, $data )
    {
        $this->update( "users", $data, "`id` = '". (int)$id ."'" );
    }
    
    
    function getUsers( $p )
    {
        $limit = 50;
        $start = $p * $limit - $limit;
        $sql = "SELECT * FROM `users` ORDER BY `fio` ASC LIMIT {$start}, {$limit};";
        $sql_c = "SELECT COUNT(*) AS `c` FROM `users`;";
        $rows = $this->get_rows_assoc( $sql );
        $count = $this->get_row_assoc( $sql_c );
        return array($rows, $count['c']);
    }
    
    
    function getMountersForOptions()
    {
        $res = $this->query( "SELECT `id`, `fio` FROM `users` WHERE `type_user` = '3' ORDER BY `fio` ASC;" );
        $rows = array();
        while( $r = $this->fetch_array($res) ) $rows[] = array("name" => $r['fio'], "value" => $r['id']);
        return $rows;
    }
    
    
    function updateArchive( $id, $type )
    {
        $this->query( "UPDATE `orders` SET `is_archived` = '". (int)$type ."' WHERE `id` = '". (int)$id ."';" );
    }
    
    
    function getUserEmailsByOrder( $oid )
    {
        return $this->get_rows_assoc( "SELECT `u`.`email`, `u`.`fio`, `u`.`id`, `u`.`type_user` FROM `orders` AS `o`
            LEFT JOIN `users` AS `u` ON `u`.`id` IN (`o`.`created_by`, `o`.`created_for`)
            WHERE `o`.`id` ". (is_array($oid) ? "IN(". implode(",", $oid) .")" : "= '". (int)$oid) ."';" );
    }
    
    
    function getAdminIds()
    {
        $results = $this->get_rows_assoc( "SELECT `id` FROM `users` WHERE `type_user` = '1';" );
        $rows = array();
        foreach( $results as $r ) $rows[] = $r['id'];
        return $rows;
    }
    
    
    function getOrdersForExport( $user_id, $user_type, $sdate, $edate, $sum_variant=false )
    {
        $sql = "SELECT 
            IF(`orders`.`trc`='Другое', `orders`.`trc_other`, `orders`.`trc`) AS `_trc`,
            `orders`.*, `users`.`fio` AS `fio`
            FROM `orders` LEFT JOIN `users` ON `users`.`id` = `orders`.`created_by`";
        $sql .= " WHERE `orders`.`is_archived` = '0' AND `orders`.`status` = '3' ";
        if( $user_type == 2 )
        {
            $sql .= " AND `orders`.`created_by` = '". (int)$user_id ."'";
        }elseif( $user_type == 3 )
        {
            $sql .= " AND `orders`.`created_for` = '". (int)$user_id ."'";
        }
        $sql .= " AND (`date` BETWEEN '". $sdate ."' AND '". $edate ."')";
        $sql .= " ORDER BY `orders`.`trc`;";
        $rows = $this->get_rows_assoc( $sql );
//         var_dump( $rows, $sql );die;
        $data = array();
        foreach( $rows as $row )
        {
            if( $sum_variant )
            {
                $key = $row["fio"];
            }else
            {
                $key = $row['trc_other'] ? "Прочее" : $row['trc'];
            }
            if( !array_key_exists($key, $data) ) $data[$key] = array();
            $data[$key][] = $row;
        }
        return $data;
    }
    
    
    function getUsersByIds( $ids )
    {
        foreach( $ids as $k=>$v )
        {
            if( !$v ) unset($ids[$k]);
        }
        return $this->get_rows_assoc( "SELECT * FROM `users` WHERE `id` IN(". implode(",", $ids) .");" );
    }
    
}

?>
