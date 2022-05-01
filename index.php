<?php

define( "DOCROOT", dirname(__FILE__) ."/" );

include_once( DOCROOT ."includes/db.class.php" );
include_once( DOCROOT ."includes/form.class.php" );

class Index{


    var $routes = array(
        "index" => "index",
        "add" => "add",
        "del" => "delete",
        "login" => "login",
        "users" => "users",
        "logout" => "logout",
        "editform" => "getEditForm",
        "save" => "save",
        "updateComment" => "updateComment",
        "updateStatus" => "updateStatus",
        "reg" => "register",
        "changeStatus" => "changeStatus",
        "mycab" => "myCabinet",
        "archive" => "archive",
        "export" => "export"
    );
    var $user_info;
    var $db;


    function __construct()
    {
        $this->db = new DB;
        $act = trim(@$_GET['act']);
        if( !$this->isAuthorized() && $act != "login" && $act != "logout" && $act != "reg" ) $act = "login";
        if( !array_key_exists($act, $this->routes) ) $act = "index";
        $this->form = new Form;
        call_user_func(array($this, $this->routes[$act]));
    }


    function isAuthorized()
    {
        $this->db->clearOldSessions();
        $sessid = @$_COOKIE['sessid'];
        if( !$sessid ) return false;
        $this->user_info = $this->db->getUserInfoBySessid( $sessid );
        if( !$this->user_info ) return false;
        return true;
    }


    function index()
    {
        $table_headers = array(
            array("№", "id"),
            array("Отметка времени", "date_create"),
            array("Дата монтажа", "date"),
            array("Трц", "trc"),
            array("Вид работ", "type_work"),
            array("Бренд", "brand"),
            array("Где печать", "where_print"),
            array("Фотопривязка", false),
            $this->user_info['type_user'] != 3 ? array("Менеджер", "created_by") : array("", ""),
            $this->user_info['type_user'] == 1 ? array("Монтажник", "created_for") : array("", ""),
            array("Ст-ть", "price"),
            $this->user_info['type_user'] == 1 ? array("Ст-ть адм.", "price_admin") : array("", ""),
            array("Важность", "importance"),
            array("Статус", "status"),
            array("Ком-ии", false),
            $this->user_info['type_user'] == 1 ? array("Ком-ий мен.", false) : array("", ""),
            array("Действия", false),
        );
        if( $this->user_info['type_user'] == 1 )
        {
            $table_headers[] = "";
        }
        include_once( DOCROOT ."configs/form_data.php" );
        $p = isset($_GET['p']) ? (intval($_GET['p']) < 1 ? 1 : intval($_GET['p'])) : 1;
        $archived = isset($_GET['archived']) ? true : false;
        $sort = isset($_GET['sort']) ? explode("|", $_GET['sort']) : array("id", "DESC");
        list($data, $c_all) = $this->db->getRows( $this->user_info['id'], $this->user_info['type_user'], $p, $sort[0], $sort[1], $archived );
        $all_pages = ceil($c_all / 50);
        $status_class = array(1 => "red", 2 => "yellow", 3 => "green");
        $status_text = array(1 => "В ожидании", 2 => "Принят", 3 => "Выполнено");
        $this->include_template( 
            "index",
            array(
                "archived" => $archived,
                "p" => $p,
                "data" => $data,
                "table_headers" => $table_headers,
                "all_pages" => $all_pages,
                "trc_options" => json_encode($trc_options),
                "where_values" => json_encode($where_values),
                "importance_values" => json_encode($importance_values),
                "status_class" => $status_class,
                "status_text" => $status_text
            )
        );
    }
    
    
    function archive()
    {
        $id = @$_GET['id'];
        if( !$id )
        {
            echo "Ошибка! ID не задан";
            exit;
        }
        $type = (int)@$_GET['type'];
        $type = in_array($type, array(0, 1)) ? $type : 0;
        $this->db->updateArchive( $id, $type );
        echo "OK";
        exit;
    }
    
    
    function fillFormData( $data=array() )
    {
        include_once( DOCROOT ."configs/form_data.php" );
        $this->form->setFormName( "order" );
        $this->form->add( "trc", array(
            "required" => true,
            "type" => "radio",
            "values" => $trc_options,
            "human_name" => "трц",
            "checked" => $data ? $data['trc'] : ""
        ) );
        $this->form->add( "trc_other", array(
            "required" => false,
            "type" => "input",
            "value" => $data && $data['trc'] == 'Другое' ? $data['trc_other'] : ""
        ) );
        $this->form->add( "date", array(
            "required" => true,
            "type" => "input",
            "type_input" => "text",
            "human_name" => "Дата монтажа",
            "id" => "date",
            "value" => $data ? $data['date'] : ""
        ) );
            
        $this->form->add( "type_work", array(
            "required" => true,
            "type" => "textarea",
            "human_name" => "Вид работ",
            "value" => $data ? $data['type_work'] : ""
        ) );
        $this->form->add( "brand", array(
            "required" => true,
            "type" => "input",
            "human_name" => "Бренд",
            "value" => $data ? $data['brand'] : ""
        ) );
        $this->form->add( "where_print", array(
            "required" => true,
            "type" => "radio",
            "human_name" => "Где печать",
            "values" => $where_values,
            "checked" => $data ? $data['where_print'] : ""
        ) );
        $this->form->add( "where_other", array(
            "required" => false,
            "type" => "input",
            "value" => $data && $data['where_print'] == 'Другое' ? $data['where_other'] : ""
        ) );
        $this->form->add( "photo", array(
            "required" => true,
            "type" => "textarea",
            "human_name" => "Фотопривязка",
            "value" => $data ? $data['photo'] : ""
        ) );
        $this->form->add( "price", array(
            "required" => true,
            "type" => "input",
            "human_name" => "Стоимость",
            "value" => $data ? $data['price'] : ""
        ) );
        if( $this->user_info['type_user'] == 1 )
        {
            $this->form->add( "price_admin", array(
                "required" => true,
                "type" => "input",
                "human_name" => "Стоимость адм.",
                "value" => $data ? $data['price_admin'] : "",
                "id" => "price_admin"
            ) );
        }
        $this->form->add( "importance", array(
            "required" => true,
            "type" => "radio",
            "human_name" => "Важность",
            "values" => $importance_values,
            "checked" => $data ? $data['importance'] : ""
        ) );
        $this->form->add( "importance_other", array(
            "required" => false,
            "type" => "input",
            "value" => $data && $data['importance_other'] == 'Другое' ? $data['importance_other'] : ""
        ) );
        if( $this->user_info['type_user'] == 1 )
        {
            $this->form->add( "created_for", array(
                "required" => false,
                "type" => "select",
                "options" => $this->db->getMountersForOptions(),
                "selected" => $data ? $data['created_for'] : "",
                "human_name" => "Монтажник",
            ) );
        }
        $this->form->add( "submit", array(
            "type" => "input",
            "type_input" => "submit",
            "value" => $data ? "Сохранить" : "Добавить"
        ) );
    }
    
    
    function add()
    {
        if( isset($_POST['submit']) )
        {
            if( $this->form->validate() )
            {
                $data = $this->form->getData();
                $data['created_by'] = isset($data['created_by']) && $data['created_by'] ? $data['created_by'] : $this->user_info['id'];
                $data['price_admin'] = isset($data['price_admin']) ? $data['price_admin'] : intval(floatval($data['price']) * 0.7);
                $data['status'] = 1;
                $id = $this->db->insertOrder( $data, $this->user_info['id'] );
                $ids = array($data['created_by']);
                if( isset($data['created_for']) && $data['created_for'] )
                {
                    $ids[] = $data['created_for'];
                }
                foreach( $this->db->getAdminIds() as $a_id )
                {
                    if( !in_array($a_id, $ids) ) $ids[] = $a_id;
                }
                $mails = $this->db->getUsersByIds( $ids );
                $status_text = array(1 => "В ожидании", 2 => "Принят", 3 => "Выполнено");
                $uri = explode("?", $_SERVER['REQUEST_URI']);
                $cab_link = "http://". $_SERVER['SERVER_NAME'] . $uri[0];
                foreach( $mails as $m )
                {
                    if( $m['type_user'] == 3 ){
                        $html = file_get_contents( DOCROOT ."templates/mail_bind_mounter.html" );
                    }elseif( ($m['type_user'] == 1 || $m['type_user'] == 2) && $m['id'] == $data['created_by'] )
                    {
                        $html = file_get_contents( DOCROOT ."templates/mail_create_order_owner.html" );
                    }elseif( $m['type_user'] == 1 && $m['id'] != $data['created_by'] && $this->user_info['type_user'] == 2 )
                    {
                        $html = file_get_contents( DOCROOT ."templates/mail_create_order_for_admin.html" );
                    }
                    $html = str_replace(
                        array("{ID}", "{FIO}", "{STATUS}", "{PHOTO}", "{MANAGER}", "{TRC}", "{DATE}", "{TYPE_WORK}", "{PRICE}", "{CAB_LINK}"),
                        array($id, $m['fio'], $status_text[$data['status']], $data['photo'], $this->user_info['fio'], $data['trc_other'] ? $data['trc_other'] : $data['trc'], $data['date'], $data['type_work'], $data['price'], $cab_link),
                        $html
                    );
                    include_once( DOCROOT ."includes/phpmailer/mailer.php" );
                    $mailer->From = "info@vvebmaster.ru";
                    $mailer->isHTML(true);
                    $mailer->FromName = "Система заявок";
                    $mailer->Subject = "Заявка на монтаж № ". $id;
                    $mailer->Body = $html;
                    $mailer->AddAddress( $m['email'] );
                    $mailer->CharSet = "UTF-8";
                    $mailer->Send();
                }
                    
                echo "OK";
                exit();
            }
        }
        $this->fillFormData();
        echo ($this->form->hasErrors() ? $this->form->getErrors() ."<br><br>\n" : "") . $this->form->getHtml();
    }
    
    
    function delete()
    {
        $id = intval(@$_GET['id']);
        if( $id )
        {
            $this->db->delete( $id );
            echo "OK";
        }else
        {
            echo "Ошибка удаления";
        }
    }
    
    
    function login()
    {
        $errors = "";
        if( isset($_POST['submit']) )
        {
            $login = $_POST['login'];
            $passwd = $_POST['passwd'];
            $user = $this->db->getUserByLoginData( $login, $passwd );
            if( !$user )
            {
                $errors = "<font color=red>Пользователь с таким логином/паролем не найден</font>";
            }else
            {
                $sessid = md5($login . $passwd . rand(11111, 99999));
                $expire = time() + 86400 * 30;
                $this->db->insertSession( $sessid, $user['id'], time() );
                setcookie( "sessid", $sessid, $expire, preg_replace('#\?.+$#', '', $_SERVER['REQUEST_URI']) );
                header( "Location: ". $_SERVER['REQUEST_URI'] );
                exit;
            }
        }
        $this->include_template( "login", array("errors" => $errors), false );
    }
    
    
    function logout()
    {
        $sessid = $_COOKIE['sessid'];
        $this->db->deleteSession( $sessid );
        unset( $_COOKIE['sessid'] );
        header( "Location: ". dirname($_SERVER['REQUEST_URI']) );
    }
    
    
    function getEditForm()
    {
        $id = intval(@$_GET['id']);
        if( $id )
        {
            $data = $this->db->getOrderAjax( $id );
        }else
        {
            $data = array();
        }
        /*if( $this->user_info['type_user'] == 1 )
        {
            $this->form->add( "created_by", array(
                "required" => false,
                "type" => "select",
                "human_name" => "Менеджер",
                "options" => $this->db->getManagersForOptions(),
                "selected" => $data ? $data['created_by'] : ""
            ) );
        }*/
        $this->form->setAction( $id ? "?act=save&id=". $id : "?act=add" );
        $this->fillFormData( $data );
        echo $this->form->getHtml();
    }
    
    
    function save()
    {
        $id = (int)$_GET['id'];
        if( isset($_POST['submit']) )
        {
            if( $this->form->validate() )
            {
                $data = $this->form->getData();
                $o = $this->db->getOrder( $id );
                $data['price_admin'] = isset($data['price_admin']) ? $data['price_admin'] : intval(floatval($data['price']) * 0.7);
                $changes = array();
                $field_name = array(
                    "date" => "Дата монтажа",
                    "trc" => "ТРЦ",
                    "brand" => "Бренд",
                    "where_print" => "Где печать",
                    "photo" => "Фото",
                    "price" => "Цена",
                    "importance" => "Важность",
                    "trc_other" => "ТРЦ",
                    "where_other" => "Где печать"
                );
                foreach( $data as $k=>$v )
                {
                    if( is_int($k) ) continue;
                    if( !in_array($k, array("date", "trc", "brand", "where_print", "photo", "price", "importance", "trc_other", "where_other")) ) continue;
                    if( $data[$k] != $o[$k] )
                    {
                        if( $v == "Другое" ) continue;
                        $changes[] = "<b>". $field_name[$k] .":</b>&nbsp;". $v;
                    }
                }
                $this->db->updateOrder( $data, $id );
                if( isset($data['created_for']) && $data['created_for'] != $o['created_for'] )
                {
                    $u = $this->db->getUser( $data['created_for'] );
                    $mail_bind_mounter = file_get_contents( DOCROOT ."templates/mail_bind_mounter.html" );
                    $cab_link = "http://". $_SERVER['SERVER_NAME'] . $_SERVER['REQUEST_URI'];
                    $mail_bind_mounter = str_replace(
                        array("{ID}", "{FIO}", "{CAB_LINK}"),
                        array($id, $u['fio'], $cab_link),
                        $mail_bind_mounter
                    );
                    include_once( DOCROOT ."includes/phpmailer/mailer.php" );
                    $mailer->From = "info@vvebmaster.ru";
                    $mailer->isHTML(true);
                    $mailer->FromName = "Система заказов";
                    $mailer->Subject = "Вам назначена заявка №". $id;
                    $mailer->Body = $mail_bind_mounter;
                    $mailer->AddAddress( $u['email'] );
                    $mailer->CharSet = "UTF-8";
                    $mailer->Send();
                }
                if( !$changes )
                {
                    echo "OK";exit();
                }
                if( $this->user_info['type_user'] == 2 )
                {
                    $ids = array($this->user_info['id']);
                    foreach( $this->db->getAdminIds() as $_id )
                    {
                        if( !in_array($_id, $ids) ) $ids[] = $_id;
                    }
                    $mails = $this->db->getUsersByIds( $ids );
                    foreach( $mails as $m )
                    {
                        if( $m['type_user'] == 2 )
                        {
                            $html = file_get_contents( DOCROOT ."templates/mail_edit_order_owner.html" );
                        }elseif( $m['type_user'] == 1 )
                        {
                            $html = file_get_contents( DOCROOT ."templates/mail_edit_order_for_admin.html" );
                        }
                        $html = str_replace(
                            array("{ID}", "{FIO}", "{CHANGES}"),
                            array($id, $m['fio'], implode("<br>", $changes)),
                            $html
                        );
                        include_once( DOCROOT ."includes/phpmailer/mailer.php" );
                        $mailer->From = "info@vvebmaster.ru";
                        $mailer->isHTML(true);
                        $mailer->FromName = "Система заявок";
                        $mailer->Subject = "Редактирование заявки № ". $id;
                        $mailer->Body = $html;
                        $mailer->AddAddress( $m['email'] );
                        $mailer->CharSet = "UTF-8";
                        $mailer->Send();
                    }
                }
                echo "OK";exit();
            }
        }
        $this->fillFormData();
        echo ($this->form->hasErrors() ? $this->form->getErrors() ."<br><br>\n" : "") . $this->form->getHtml();
    }
    
    
    function updateComment()
    {
        $id = $_GET['id'];
        $comment = $_GET['comment'];
        $for = @$_GET['for'];
        $this->db->updateComment( $id, $comment, $for, $this->user_info['type_user'] );
//         $emails = $this->db->getUserEmailsByOrder( $id );
        if( $this->user_info['type_user'] == 3 || $this->user_info['type_user'] == 2 )
        {
            $emails = $this->db->getUsersByIds( $this->db->getAdminIds() );
//             var_dump( $emails );
            $o = $this->db->getOrder( $id );
            $mail_change_comment = file_get_contents( DOCROOT ."templates/mail_change_comment_for_admin.html" );
            $mail_change_comment = str_replace("{ID}", $id, $mail_change_comment);
            $mail_change_comment = str_replace("{COMMENT}", $comment, $mail_change_comment);
            include_once( DOCROOT ."includes/phpmailer/mailer.php" );
            $tu = $this->user_info['type_user'];
            $for_name = $tu == 3 ? "монтажника" : "менеджера";
            foreach( $emails as $email )
            {
                $_html = str_replace(
                    array("{FIO}", "{DATE}", "{TRC}", "{TYPE_WORK}", "{PHOTO}", "{PRICE}", "{COMMENT}", "{ID}"),
                    array($email['fio'], $o['date'], ($o['trc_other'] ? $o['trc_other'] : $o['trc']), $o['type_work'], $o['photo'], $o['price'], $comment, $id),
                    $mail_change_comment
                );
                $mailer->From = "info@vvebmaster.ru";
                $mailer->isHTML(true);
                $mailer->FromName = "Система заказов";
                $mailer->Subject = "Комментарий {$for_name}: ". $this->user_info['fio'] ." по заявке №". $id;
                $mailer->Body = $_html;
                $mailer->AddAddress( $email['email'] );
                $mailer->CharSet = "UTF-8";
                $mailer->Send();
            }
        }else
        {
//             $emails = $this->db->getUserEmailsByOrder( $id );
            $o = $this->db->getOrder( $id );
            $ids = array($o['created_by']);
            $tu = $this->user_info['type_user'];
            if( $o['created_for'] && $tu == 3 )
            {
                $ids[] = $o['created_for'];
            }elseif( $tu == 2 )
            {
                $ids = array();
            }
            foreach( $this->db->getAdminIds() as $_id )
            {
                if( !in_array($_id, $ids) ) $ids[] = $_id;
            }
//             var_dump( $ids );
            $emails = $this->db->getUsersByIds( $ids );
            foreach( $emails as $email )
            {
                $mail_change_comment = file_get_contents( DOCROOT ."templates/mail_change_comment.html" );
                $mail_change_comment = str_replace("{ID}", $id, $mail_change_comment);
                $mail_change_comment = str_replace("{COMMENT}", $comment, $mail_change_comment);
                include_once( DOCROOT ."includes/phpmailer/mailer.php" );
                $_html = str_replace(
                    array("{FIO}", "{ID}"),
                    array($email['fio'], $id),
                    $mail_change_comment
                );
                $mailer->From = "info@vvebmaster.ru";
                $mailer->isHTML(true);
                $mailer->FromName = "Система заказов";
                $mailer->Subject = "Измененен комментарий ". $this->user_info['fio'] ." по заявке №". $id;
                $mailer->Body = $_html;
                $mailer->AddAddress( $email['email'] );
                $mailer->CharSet = "UTF-8";
                $mailer->Send();
            }
        }
        echo "OK";
    }
    
    
    function updateStatus()
    {
        $id = $_GET['id'];
        $status = $_GET['status'];
        $status = $status < 1 || $status > 3 ? 1 : $status;
        $this->db->updateStatus( $id, $status );
        $emails = $this->db->getUserEmailsByOrder( $id );
        $o = $this->db->getOrder( $id );
        $status_text = array(1 => "В ожидании", 2 => "Принят", 3 => "Выполнено");
        $mail_change_status = file_get_contents( DOCROOT ."templates/mail_change_status.html" );
        $mail_change_status = str_replace("{ID}", $id, $mail_change_status);
        $mail_change_status = str_replace("{STATUS}", $status_text[$status], $mail_change_status);
        $mail_change_status = str_replace("{TYPE_WORK}", $o['type_work'], $mail_change_status);
        include_once( DOCROOT ."includes/phpmailer/mailer.php" );
        foreach( $emails as $email )
        {
            $_html = str_replace( "{FIO}", $email['fio'], $mail_change_status );
            $mailer->From = "info@vvebmaster.ru";
            $mailer->isHTML(true);
            $mailer->FromName = "Система заказов";
            $mailer->Subject = "Изменения статуса заявки";
            $mailer->Body = $_html;
            $mailer->AddAddress( $email['email'] );
            $mailer->CharSet = "UTF-8";
            $mailer->Send();
        }
        echo "OK";
    }
    
    
    function include_template( $tpl_name, $vars, $include_header=true )
    {
        if( $vars )
        {
            foreach( $vars as $k=>$v )
            {
                $$k = $v;
            }
        }
        if( $include_header )
        {
            $user_info = $this->user_info;
            include_once( DOCROOT ."templates/header.html" );
        }
        include_once( DOCROOT ."templates/". $tpl_name .".html" );
    }
    
    
    function register()
    {
        $this->form->add( "login", array(
                "required" => true,
                "type" => "input",
                "human_name" => "Логин",
                "value" => isset($_POST['login']) ? $_POST['login'] : ""
        ) );
        $this->form->add( "email", array(
                "required" => true,
                "type" => "input",
                "type_input" => "email",
                "human_name" => "E-mail",
                "value" => isset($_POST['email']) ? $_POST['email'] : ""
        ) );
        $this->form->add( "fio", array(
                "required" => true,
                "type" => "input",
                "human_name" => "ФИО",
                "value" => isset($_POST['fio']) ? $_POST['fio'] : ""
        ) );
        $this->form->add( "passwd", array(
                "required" => true,
                "type" => "input",
                "human_name" => "Пароль"
        ) );
        $this->form->add( "type_user", array(
                "required" => true,
                "type" => "radio",
                "values" => array(array(2, "Менеджер"), array(3, "Монтажник")),
                "human_name" => "Я"
        ) );
        $this->form->add( "submit", array(  
                "required" => false,
                "type" => "input",
                "type_input" => "submit",
                "value" => "Регистрация",
        ) );
        $errors = "";
        if( isset($_POST['submit']) )
        {
            if( $this->form->validate() )
            {   
                $info = $this->form->getData();
                if( $this->db->issetLogin($info['login']) )
                {
                    $errors .= "<font color=red>Ошибка! Пользователь с таким логином уже зарегистрирован</font><br>";
                }
                if( $this->db->issetEmail($info['email']) )
                {
                    $errors .= "<font color=red>Ошибка! Пользователь с таким e-mail уже зарегистрирован</font><br>";
                }
                if( !$errors )
                {
                    $info['passwd'] = md5($info['passwd']);
                    $id = $this->db->insertUser( $info );
                    $f = file_get_contents( DOCROOT ."templates/mail.html" );
                    $f = str_replace(
                        array(
                            "{FIO}",
                            "{LOGIN}",
                            "{PASSWD}"
                        ),
                        array(
                            $info['fio'],
                            $info['login'],
                            $info['passwd']
                        ),
                        $f
                    );
                    include_once( DOCROOT ."includes/phpmailer/mailer.php" );
                    $mailer->From = "";
                    $mailer->isHTML(true);
                    $mailer->FromName = "Система заказов";
                    $mailer->Subject = "Регистрация в системе заказов";
                    $mailer->Body = $а;
                    $mailer->AddAddress( $info['email'] );
                    $mailer->CharSet = "UTF-8";
                    $mailer->Send();
                    header( "Location: ?act=index" );
                    exit;
                }
            }else
            {
                $errors = $this->form->getErrors();
            }
        }
        $this->include_template( "register", array("errors" => @$errors, "form" => $this->form->getHtml()), false );
    }
    
    
    function changeStatus()
    {
        $id = @$_GET['id'];
        if( !$id )
        {
            die( "Error! No ID present" );
        }
        $o = $this->db->getOrder( $id );
        $status = $_GET['status'];
        $order['status'] = $status;
        if( $o['created_for'] == 0 && $this->user_info['type_user'] == 3 )
        {
            $order['created_for'] = $this->user_info['id'];
        }
        $this->db->updateOrder( $order, $id );
        echo "OK";
    }
    
    
    function fillFormDataUsers( $data=array(), $fromcab=false )
    {
        $this->form->add( "login", array(
                "required" => true,
                "type" => "input",
                "human_name" => "Логин",
                "value" => $data ? $data['login'] : ""
        ) );
        $this->form->add( "email", array(
                "required" => true,
                "type" => "input",
                "type_input" => "email",
                "human_name" => "E-mail",
                "value" => isset($data['email']) ? $data['email'] : ""
        ) );
        $this->form->add( "fio", array(
                "required" => true,
                "type" => "input",
                "human_name" => "ФИО",
                "value" => isset($data['fio']) ? $data['fio'] : ""
        ) );
        $this->form->add( "passwd", array(
                "required" => false,
                "type" => "input",
                "human_name" => "Пароль"
        ) );
        $this->form->add( "repasswd", array(
                "required" => false,
                "type" => "input",
                "human_name" => "Повторите пароль"
        ) );
        $this->form->add( "type_user", array(
                "required" => true,
                "type" => "radio",
                "values" => array(array(1, "Администратор"), array(2, "Менеджер"), array(3, "Монтажник")),
                "human_name" => "Тип пользователя",
                "checked" => isset($data['type_user']) ? $data['type_user'] : ""
        ) );
        $this->form->add( "submit", array(  
                "required" => false,
                "type" => "input",
                "type_input" => "submit",
                "value" => "Сохранить",
        ) );
    }
    
    
    function fillFormDataUser( $data )
    {
        $this->form->add( "email", array(
                "required" => true,
                "type" => "input",
                "type_input" => "email",
                "human_name" => "E-mail",
                "value" => isset($data['email']) ? $data['email'] : ""
        ) );
        $this->form->add( "fio", array(
                "required" => true,
                "type" => "input",
                "human_name" => "ФИО",
                "value" => isset($data['fio']) ? $data['fio'] : ""
        ) );
        $this->form->add( "passwd", array(
                "required" => false,
                "type" => "input",
                "human_name" => "Пароль"
        ) );
        $this->form->add( "repasswd", array(
                "required" => false,
                "type" => "input",
                "human_name" => "Повторите пароль"
        ) );
        $this->form->add( "submit", array(  
                "required" => false,
                "type" => "input",
                "type_input" => "submit",
                "value" => "Сохранить",
        ) );
    }
        
    
    function users()
    {
        if( $this->user_info['type_user'] != 1 )
        {
            header( "Location: ?act=index" );
            exit;
        }
        if( isset($_GET['del']) )
        {
            $id = (int)$_GET['id'];
            $this->db->deleteUser( $id );
            echo "OK";
            exit;
        }
        if( isset($_POST['submit']) )
        {
            $id = intval(@$_GET['id']);
            $u = $this->db->getUser( $id );
            if( !$u )
            {
                echo "Ошибка! Пользователь не найден";
                exit;
            }
            $this->fillFormDataUsers( $u );
            if( !$this->form->validate() )
            {
                echo $this->form->getErrors();
                exit;
            }
            $data = $this->form->getData();
            if( $data['passwd'] && $data['passwd'] != $data['repasswd'] )
            {
                echo "Пароли не совпадают";
                exit;
            }
            if( !$data['passwd'] )
            {
                unset($data['passwd']);
                unset($data['repasswd']);
            }else
            {
                $data['passwd'] = md5($data['passwd']);
                unset($data['repasswd']);
            }
            $this->db->updateUser( $id, $data );
            echo "OK";
            exit;
        }
        if( isset($_GET['getform']) )
        {
            $id = $_GET['id'];
            $u = $this->db->getUser( $id );
            if( !$u )
            {
                echo "Пользователь не найден";
                exit;
            }
            $this->fillFormDataUsers( $u );
            $this->form->setFormName( "users" );
            $this->form->setAction( "?act=users&id=". (int)$id );
            echo $this->form->getHtml();
            exit;
        }
        $p = isset($_GET['p']) ? (int)$_GET['p'] : 1;
        list($users, $c_all) = $this->db->getUsers( $p );
        $all_pages = ceil($c_all / 50);
        $user_types = array(1 => "Админ", 2 => "Менеджер", 3 => "Монтажник");
        $this->include_template(
            "users",
            array("p" => $p, "all_pages" => $all_pages, "users" => $users, "user_types" => $user_types)
        );
    }
    
    
    function myCabinet()
    {
        if( isset($_POST['submit']) )
        {
            $id = $this->user_info['id'];
            $u = $this->db->getUser( $id );
            if( !$u )
            {
                echo "Ошибка! Пользователь не найден";
                exit;
            }
            $this->fillFormDataUser( $u );
            if( !$this->form->validate() )
            {
                echo $this->form->getErrors();
                exit;
            }
            $data = $this->form->getData();
            if( $data['passwd'] && $data['passwd'] != $data['repasswd'] )
            {
                echo "Пароли не совпадают";
                exit;
            }
            if( !$data['passwd'] )
            {
                unset($data['passwd']);
                unset($data['repasswd']);
            }else
            {
                $data['passwd'] = md5($data['passwd']);
                unset($data['repasswd']);
            }
            $this->db->updateUser( $id, $data );
            header( "Location: ?act=mycab" );
            exit;
        }
        $u = $this->db->getUser( $this->user_info['id'] );
        $this->fillFormDataUser( $u );
        $this->include_template( "user", array("form" => $this->form->getHtml()) );
    }
    
    
    function export()
    {
        $sdate = $_GET['sdate'];
        $edate = $_GET['edate'];
        $sum_variant = isset($_GET['sum']) ? true : false;
        $rows = $this->db->getOrdersForExport( $this->user_info['id'], $this->user_info['type_user'], $sdate, $edate, $sum_variant );
        if( $this->user_info['type_user'] == 1 && !$sum_variant )
        {
            $table_headers = array(
                array("№", "id", "A"),
                array("Наименование работ и место производства", "type_work", "B"),
                array("Дата", "date", "C"),
                array("Фонд оплаты рабочих", "price", "D"),
                array("Оплата на ИнЦентр", "fio", "E"),
                array(" ", false, "F"),
                array("сумма менеджеры", false, "G"),
                array("доход", false, "H")
            );
            $sum_price = null;
        }elseif( $this->user_info['type_user'] == 3 )
        {
            $table_headers = array(
                array("№ заказа", "id", "A"),
                array("Дата монтажа", "date", "B"),
                array("Вид работ", "type_work", "C"),
                array("Фотопривязка", "photo", "D"),
                array("Стоимость", "price_admin", "E"),
            );
            $sum_price = array("price_admin", "E");
        }elseif( $this->user_info['type_user'] == 1 && $sum_variant )
        {
            $table_headers = array(
                array("№ заказа", "id", "A"),
                array("Дата монтажа", "date", "B"),
                array("ТРЦ", "_trc", "C"),
                array("Вид работ", "type_work", "D"),
                array("Фотопривязка", "photo", "E"),
                array("Стоимость мен.", "price", "F"),
                array("Стоимость", "price_admin", "G"),
                array("Сумма", "price - price_admin", "H")
            );
            $sum_price = array("price - price_admin", "H");
        }
        include_once( DOCROOT ."includes/PHPExcel/writer.php" );
        $writer = new XLSWriter($table_headers);
        $writer->write( $rows, $sum_price );
        exit;
    }
    
    
}


$i = new Index;

?>
