<!DOCTYPE html>
<head><meta charset="utf-8"></head>

<body>

<h3>Здравствуйте {{ $fio }}</h3><br>

Вы отредактировали заявку № {{ $id }}. Изменилось:<br>
@foreach ($changes as $change)
{{ $change }}<br>
@endforeach

</body>
</html>
