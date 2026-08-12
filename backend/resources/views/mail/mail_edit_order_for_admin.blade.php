<!DOCTYPE html>
<head><meta charset="utf-8"></head>

<body>

<h3>Здравствуйте {{ $fio }}</h3><br>

Заявка № {{ $id }}. Изменилось:<br>
@foreach ($changes as $change)
{{ $change }}<br>
@endforeach

</body>
</html>
