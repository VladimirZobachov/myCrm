var showForm = function(id)
{
    url = "?act=editform&" + (id ? "id=" + id : "");
    $.ajax(url).done(function(data)
    {
        $('#form-modal').html(data);
        $('#date').datepicker({dateFormat: "yy-mm-dd"});
        $('#form-modal').dialog();
        $('input[name=price]').on("input", function()
        {
            val = parseInt($('input[name=price]').val());
            val = parseInt(val * 0.7);
            if( val == 0 || val == NaN ) return;
            $('#price_admin').val(parseInt(val * 0.7));
        });
        $("form[name=order]").on("submit", function()
        {
            data = $("form[name=order]").serialize();
            data += "&submit=";
            url = id ? "?act=save&id=" + id : "?act=add";
            $.post(url, data).done(function(reply)
            {
                if( reply == "OK" )
                {
                    location.reload();
                }else
                {
                    alert(reply);
                }
            });
            return false;
        });
    });
}

var hello = function(id)
{
    url = "?act=editform&" + (id ? "id=" + id : "");
    $.ajax(url).done(function(data)
    {
        $('#form-modal').html(data);
        $('#date').datepicker({dateFormat: "yy-mm-dd"});
        $('#form-modal').dialog();
        $('input[name=price]').on("input", function()
        {
            val = parseInt($('input[name=price]').val());
            val = parseInt(val * 0.7);
            if( val == 0 || val == NaN ) return;
            $('#price_admin').val(parseInt(val * 0.7));
        });
        $("form[name=order]").on("submit", function()
        {
            data = $("form[name=order]").serialize();
            data += "&submit=";
            url = "?act=add";
            $.post(url, data).done(function(reply)
            {
                if( reply == "OK" )
                {
                    location.reload();
                }else
                {
                    alert(reply);
                }
            });
            return false;
        });
    });
}


var changeStatus = function(id, get, addr, curr)
{
    if( !get )
    {
        html = "<label>???????????????? ?????????? ????????????</label><br>";
        statuses = [[1, "?? ????????????????"], [2, "??????????????"], [3, "??????????????????"]];
        for( i in statuses )
        {
            html += "<input type=\"radio\" name=\"status\" value=\"" + statuses[i][0] + "\"" +
                (curr == statuses[i][0] ? "checked=\"checked\"" : "") + "\
                >&nbsp;&nbsp;" + statuses[i][1] + "<br>";
        }
        html += "<input type=\"submit\" name=\"submit\" value=\"????????????????\" onclick=\"changeStatus('" + id + "', true, " + addr + ")\">";
        $('#form-modal').html(html);
        $('#form-modal').dialog();
    }else
    {
        if( !addr )
        {
            addr = "updateStatus";
        }else
        {
            addr = "changeStatus";
        }
        status = $("input[name=\"status\"]:checked").val();
        $.ajax('?act=' + addr + '&id=' + id + "&status=" + encodeURIComponent(status)).done(function(reply)
        {
            if( reply == "OK" )
            {
                setStatus(id, status);
            }else
            {
                alert( "????????????!" );
            }
            $("#form-modal").dialog('close');
        });
    }
};


var changeComment = function(id, type_user, get)
{
    if( !get )
    {
        html = "<label>?????????????? ?????????? ??????????????????????</label><br>";
        html += "<textarea name=\"comment\"></textarea><br>";
        if( type_user == 1 )
        {
            html += "<label>????????:</label><br>\
                <select name=\"for\">\
                <option value=\"1\">????????????????????</option>\
                <option value=\"2\">??????????????????</option>\
            </select><br>";
        }
        html += "<input type=\"submit\" name=\"submit\" value=\"????????????????\" \
            onclick=\"changeComment('" + id + "', " + type_user + ", true)\">";
        $('#form-modal').html(html);
        $('#form-modal').dialog();
    }else
    {
        comment = $("textarea[name=\"comment\"]").val();
        comment_for = $("select[name='for'] option:selected").val();
        $.ajax('?act=updateComment&id=' + id + "&for=" + comment_for +"&comment=" + encodeURIComponent(comment)).done(function(reply)
        {
            if( reply == "OK" )
            {
                setComment(id, comment);
            }else
            {
                alert( "????????????!" );
            }
            $("#form-modal").dialog('close');
        });
    }
};


var setComment = function(id, comment)
{
    $('#comments_' + id).html(comment);
}


var setStatus = function(id, status)
{
    el = $('#status_' + id);
    status = parseInt(status);
    if( status == 2 )
    {
        el.attr('class', 'yellow');
        el.html('??????????????');
    }else if( status == 3 )
    {
        el.attr('class', 'green');
        el.html('??????????????????');
    }else
    {
        el.attr('class', 'red');
        el.html('?? ????????????????');
    }
};


function changeStatusM(id, status)
{
    changeStatus(id, status, true);
}


function del(id)
{
    $.ajax("?act=del&id=" + id).done(function(reply)
    {
        if( reply == "OK" )
        {
            location.reload();
        }else
        {
            alert(reply);
        }
    });
};


var openExport = function()
{
    $('#export-modal').dialog();
    $('input[name=sdate').datepicker({dateFormat: "dd.mm.yy"});
    $('input[name=edate').datepicker({dateFormat: "dd.mm.yy"});
}
