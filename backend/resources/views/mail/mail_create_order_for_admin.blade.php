<!DOCTYPE html>
<head><meta charset="utf-8"></head>

<body>

<h3>Здравствуйте {{ $fio }}</h3><br>

Cоздана заявка на монтаж на дату: {{ $date }}.<br>
Менеджер: {{ $manager }}.<br>
ТРЦ: {{ $trc }}.<br>
Вид работ: {{ $type_work }}.<br>
Фотопривязка: <a href="{{ $photo }}">{{ $photo }}<br>
Стоимость: {{ $price }}.

</body>
</html>
