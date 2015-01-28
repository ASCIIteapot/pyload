# -*- coding: utf-8 -*-

__author__ = 'Developer'

from module.plugins.Hoster import Hoster
from module.plugins.Plugin import Fail

class TestFileHoster(Hoster):
    __name__ = 'TestFileHoster'
    __description__ = "Hoster for testing files"
    __pattern__ = r'http://TestFile/.*'
    __config__ = [("activated", "bool", "activated", "True")]

    def process(self, pyfile):
        while True:
            self.setWait(5)
            self.wait()
            captcha_url = 'http://pyload.org/lib/tpl/pyload//images/pyload-logo-edited3.5-new-font-small.png'
            self.decryptCaptcha(captcha_url, forceUser=True)
            self.fail(u'Бряк')