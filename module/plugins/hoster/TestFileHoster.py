# -*- coding: utf-8 -*-
from module.network.Browser import Browser

__author__ = 'Developer'

from module.plugins.Hoster import Hoster
from module.plugins.Plugin import Fail
from time import sleep

class TestFileHoster(Hoster):
    __name__ = 'TestFileHoster'
    __description__ = "Hoster for testing files"
    __pattern__ = r'http://TestFile/.*'
    __config__ = [("activated", "bool", "activated", "True")]

    class TestBrowser():
        def __init__(self):
            self._speed = 0
            self._size = 0
            self._arrived = 0

        @property
        def speed(self):
            return self._speed

        @speed.setter
        def speed(self, val):
            self._speed = val

        @property
        def size(self):
            return self._size

        @size.setter
        def size(self, val):
            self._size = val

        @property
        def arrived(self):
            return self._arrived

        @arrived.setter
        def arrived(self, val):
            self._arrived = val

        @property
        def percent(self):
            if not self.size: return 0
            return (self.arrived * 100) / self.size

        def clearCookies(self):
            pass

        def clearReferer(self):
            pass

        def abortDownloads(self):
            pass

        def httpDownload(self, url, filename, get={}, post={}, ref=True, cookies=True, chunks=1, resume=False,
                         progressNotify=None, disposition=False):
            """ this can also download ftp """
            pass

        def load(self, *args, **kwargs):
            """ retrieves page """
            pass

        def putHeader(self, name, value):
            """ add a header to the request """
            pass

        def addAuth(self, pwd):
            """Adds user and pw for http auth

            :param pwd: string, user:password
            """
            pass

        def removeAuth(self):
            pass

        def setOption(self, name, value):
            """Adds an option to the request, see HTTPRequest for existing ones"""
            pass

        def deleteOption(self, name):
            pass

        def clearHeaders(self):
            pass

        def close(self):
            """ cleanup """
            pass

    def init(self):
        self.req_back = self.req
        # self.req = TestFileHoster.TestBrowser()

    def process(self, pyfile):
        while True:
            self.setWait(5)
            self.wait()
            captcha_url = 'http://pyload.org/lib/tpl/pyload//images/pyload-logo-edited3.5-new-font-small.png'
            self.decryptCaptcha(captcha_url, forceUser=True)
            self.download()
            self.fail(u'Бряк')

    def download(self, size=1234567, speed=10000, filename='testfile', url='http://testfile'):
        """Downloads the content at url to download folder

        :param url:
        :param get:
        :param post:
        :param ref:
        :param cookies:
        :param disposition: if True and server provides content-disposition header\
        the filename will be changed if needed
        :return: The location where the file was saved
        """

        self.req = TestFileHoster.TestBrowser()


        try:
            self.pyfile.size = size
            self.req.size = size
            self.req.speed = speed
            self.pyfile.setStatus("downloading")
            self.core.hookManager.dispatchEvent("downloadStarts", self.pyfile, url, filename)

            sleep_time = (float(size)/speed)/100
            for percent in xrange(0, 100):
                # speed = size/s
                # s = size/speed
                sleep(sleep_time)
                self.req.arrived = int(percent * float(size)/100)
                self.pyfile.setProgress(percent)
        finally:
            self.req = self.req_back



        self.lastDownload = filename
        return self.lastDownload