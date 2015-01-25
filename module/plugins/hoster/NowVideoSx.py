# -*- coding: utf-8 -*-

import re

from module.plugins.internal.SimpleHoster import SimpleHoster, create_getInfo


class NowVideoSx(SimpleHoster):
    __name__    = "NowVideoSx"
    __type__    = "hoster"
    __version__ = "0.10"

    __pattern__ = r'http://(?:www\.)?nowvideo\.(at|ch|co|eu|li|sx)/(video|mobile/#/videos)/(?P<ID>\w+)'

    __description__ = """NowVideo.sx hoster plugin"""
    __license__     = "GPLv3"
    __authors__     = [("Walter Purcaro", "vuolter@gmail.com")]


    URL_REPLACEMENTS = [(__pattern__ + ".*", r'http://www.nowvideo.sx/video/\g<ID>')]

    NAME_PATTERN = r'<h4>(?P<N>.+?)<'
    OFFLINE_PATTERN = r'>This file no longer exists'

    LINK_FREE_PATTERN = r'<source src="(.+?)"'
    LINK_PREMIUM_PATTERN = r'<div id="content_player" >\s*<a href="(.+?)"'


    def setup(self):
        self.resumeDownload = True
        self.multiDL        = True


    def handleFree(self, pyfile):
        self.html = self.load("http://www.nowvideo.sx/mobile/video.php", get={'id': self.info['pattern']['ID']})

        m = re.search(self.LINK_FREE_PATTERN, self.html)
        if m is None:
            self.error(_("Free download link not found"))

        self.download(m.group(1))


getInfo = create_getInfo(NowVideoSx)
