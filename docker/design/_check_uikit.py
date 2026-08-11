import html.parser

class Checker(html.parser.HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack = []
        self.void = {'meta','link','br','img','input','hr','col','area','base','embed','source','track','wbr'}
        self.errors = []
    def handle_starttag(self, tag, attrs):
        if tag not in self.void:
            self.stack.append(tag)
    def handle_endtag(self, tag):
        if not self.stack:
            self.errors.append(('EXTRA CLOSE', tag))
            return
        if self.stack[-1] == tag:
            self.stack.pop()
        else:
            if tag in self.stack:
                self.errors.append(('MISMATCH', tag, 'expected', self.stack[-1]))
                while self.stack and self.stack[-1] != tag:
                    self.stack.pop()
                if self.stack:
                    self.stack.pop()
            else:
                self.errors.append(('UNKNOWN CLOSE (self-closed?)', tag))

c = Checker()
data = open('ui-kit.html', encoding='utf-8').read()
c.feed(data)
print('errors:', c.errors)
print('unclosed stack:', c.stack)
