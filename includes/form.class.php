<?php


class Form{


    private $fields = array();
    private $errors = array();
    private $default_class_name = "";
    private $validate_ok = false;
    private $action = "";
    private $method = "POST";
    private $form_name = "form";
    private $on_submit = "";


    public function add( $name, $params )
    {
        if( !isset($params['min_length']) ) $params['min_length'] = 0;
        if( !isset($params['required']) ) $params['required'] = false;
        if( !isset($params['on']) ) $params['on'] = "";
        if( !isset($params['maxlength']) ) $params['maxlength'] = 0;
        if( !isset($params['on_name']) ) $params['on_name'] = "";
        if( !isset($params['class_name']) ) $params['class_name'] = $this->default_class_name;
        if( !isset($params['type']) ) $params['type'] = "input";
        if( !isset($params['type_input']) ) $params['type_input'] = "text";
        $this->fields[$name] = $params;
    }

    public function clear()
    {
        $this->fields = array();
    }

    public function validate()
    {
        $this->setValidateStatus( true );
        foreach( $_POST as $name=>$v )
        {
            if( !array_key_exists($name, $this->fields) )
            {
                $this->fields[$name] = array("value" => trim($v));
            }else
            {
                if( $this->fields[$name]['required'] && !$v )
                {
                    $this->errors[] = "<font color=red>Поле <b>". 
                        $this->fields[$name]['human_name'] ."</b> является обязательным для заполнения</font>";
                    $this->setValidateStatus( false );
                }elseif( $this->fields[$name]['min_length'] && strlen($v) < $this->fields[$name]['min_length'] )
                {
                    $this->errors[] = "<font color=red>Минимальная длина поля <b>". 
                        $this->fields[$name]['human_name'] ."</b> составляет <b>". $this->fields[$name]['min_length'] ."</b></font>";
                    $this->setValidateStatus( false );
                }
                $validate_type = @$this->fields[$name]['validate_type'];
                if( $validate_type == "int" )
                {
                    $v = intval($v);
                }elseif( $validate_type == "default" )
                {
                    $v = trim(htmlspecialchars($v));
                }elseif( $validate_type == "string" )
                {
                    $v = trim($v);
                }else{
                    $v = trim($v);
                }
                $this->fields[$name]['value'] = $v;
            }
        }
        return $this->getValidateStatus();
    }
    
    function setValidateStatus( $status )
    {
        $this->validate_ok = $status;
    }
    
    function getValidateStatus()
    {
        return $this->validate_ok;
    }
    
    function getErrors()
    {
        return implode("<br>\n", $this->errors);
    }
    
    function hasErrors()
    {
        return $this->errors ? true : false;
    }
    
    function getData()
    {
        if( !$this->getValidateStatus() ) return array();
        $data = array();
        foreach( $this->fields as $k=>$v )
        {
            if( $k == "submit" ) continue;
            $data[$k] = $v['value'];
        }
        return $data;
    }
    
    function getFields()
    {
        return $this->fields;
    }
    
    function setAction( $val )
    {
        $this->action = $val;
    }
    
    function getAction()
    {
        return $this->action;
    }
    
    function setMethod( $val )
    {
        $this->method = $val;
    }
    
    function getMethod()
    {
        return $this->method;
    }
    
    function setFormName( $val )
    {
        $this->form_name = $val;
    }
    
    function getFormName()
    {
        return $this->form_name;
    }
    
    function setOnSubmit( $val )
    {
        $this->on_submit = $val;
    }
    
    function getOnSubmit()
    {   
        return $this->on_submit;
    }
    
    function setDefaultClassName( $val )
    {
        $this->default_class_name = $val;
    }
    
    function getClassName()
    {
        return $this->default_class_name;
    }
    
    function getHtml()
    {
        $html = "<form action=\"". $this->action ."\" method=\"". $this->method ."\"";
        $html .= $this->getFormName() ? " name=\"". $this->getFormName() ."\"" : "";
        $html .= $this->getOnSubmit() ? " onsubmit=\"". $this->getOnSubmit() ."\"" : "";
        $html .= ">\n";
        foreach( $this->fields as $k=>$field )
        {
            if( isset($field['human_name']) && $field['human_name'] )
            {
                $html .= "<label><b>". $field['human_name'] .":</b></label>";
                $html .= $field['required'] ? "\n\t<span class=\"required\">*</span>\n" : "";
                $html .= "<br>";
            }
            if( $field['type'] == "select" )
            {
                $html .= "\t<select name=\"". $k ."\"";
                $html .= $field['required'] ? " required=\"required\"" : "";
                $html .= $field['on'] && $field['on_name'] ? " ". $field['on_name'] ."=\"". $field['on'] ."\"" : "";
                $html .= $field['class_name'] ? " class=\"". $field['class_name'] ."\"" : "";
                $html .= isset($field['id']) ? " id=\"". $field['id'] ."\"" : "";
                $html .= ">\n";
                foreach( $field['options'] as $option )
                {
                    $html .= "\t\t<option value=\"". $option['value'] ."\"";
                    $html .= @$field['selected'] == $option['value'] ? " selected=\"selected\"" : "";
                    $html .= ">". $option['name'] ."</option>\n";
                }
                $html .= "</select><br>\n";
            }elseif( $field['type'] == "checkbox" )
            {
                $html .= "\t<input type=\"checkbox\" name=\"". $k ."\"";
                $html .= $field['required'] ? " required=\"required\"" : "";
                $html .= $field['class_name'] ? " class=\"". $field['class_name'] ."\"" : "";
                $html .= isset($field['checked']) && $field['checked'] ? " checked=\"checked\"" : "";
                $html .= isset($field['value']) && $field['value'] ? " value=\"". $field['value'] ."\"" : "";
                $html .= isset($field['id']) ? " id=\"". $field['id'] ."\"" : "";
                $html .= "><br>\n";
            }elseif( $field['type'] == "input" )
            {
                $html .= "\t<input type=\"". $field['type_input'] ."\" name=\"". $k ."\"";
                $html .= $field['required'] ? " required=\"required\"" : "";
                $html .= $field['class_name'] ? " class=\"". $field['class_name'] ."\"" : "";
                $html .= $field['maxlength'] ? " maxlength=\"". $field['maxlength'] ."\"" : "";
                $html .= isset($field['value']) ? " value=\"". $field['value'] ."\"" : "";
                $html .= isset($field['id']) ? " id=\"". $field['id'] ."\"" : "";
                $html .= "><br>\n";
            }elseif( $field['type'] == "radio" )
            {
                foreach( $field['values'] as $val )
                {
                    $html .= "\t<input type=\"radio\" name=\"". $k ."\" value=\"". $val[0] ."\"";
                    $html .= @$field['checked'] == $val[0] ? " checked=\"checked\"" : "";
                    $html .= ">&nbsp;&nbsp;&nbsp;\n";
                    $html .= "\t<span>". $val[1] ."</span><br>\n";
                }
            }elseif( $field['type'] == "textarea" )
            {
                $html .= "<textarea name=\"{$k}\" ";
                $html .= $field['required'] ? " required=\"required\"" : "";
                $html .= $field['class_name'] ? " class=\"". $field['class_name'] ."\"" : "";
//                 $html .= isset($field['value']) ? " value=\"". $field['value'] ."\"" : "";
                $html .= isset($field['id']) ? " id=\"". $field['id'] ."\"" : "";
                $html .= ">".  @$field['value'] ."</textarea><br>\n";
            }
        }
        $html .= "</form>";
        return $html;
    }
    
}

?>
