#!/usr/bin/env python
# -*- coding: utf-8 -*-

from traceback import print_exc
from shutil import copyfileobj

from os.path import join
from bottle import route, request, HTTPError
from webinterface import PYLOAD
from utils import login_required, render_to_response, toDict
from module.utils import decode, formatSize
from module import PyFile


_invert_pyfile_status_map = dict((reversed(kvp) for kvp in PyFile.statusMap.iteritems()))

def format_time(seconds):
    seconds = int(seconds)

    hours, seconds = divmod(seconds, 3600)
    minutes, seconds = divmod(seconds, 60)
    return "%.2i:%.2i:%.2i" % (hours, minutes, seconds)


def get_sort_key(item):
    return item["order"]


@route("/json/status")
@route("/json/status", method="POST")
@login_required('LIST')
def status():
    try:
        status = toDict(PYLOAD.statusServer())
        status['captcha'] = PYLOAD.isCaptchaWaiting()
        return status
    except:
        return HTTPError()


@route("/json/links")
@route("/json/links", method="POST")
@login_required('LIST')
def links():
    try:
        links = [toDict(x) for x in PYLOAD.statusDownloads()]
        ids = []
        for link in links:
            ids.append(link['fid'])

            if link['status'] == 12:
                link['info'] = "%s @ %s/s" % (link['format_eta'], formatSize(link['speed']))
            elif link['status'] == 5:
                link['percent'] = 0
                link['size'] = 0
                link['bleft'] = 0
                link['info'] = _("waiting %s") % link['format_wait']
            else:
                link['info'] = ""

            link['status'] = _invert_pyfile_status_map[link['status']]

        data = {'links': links, 'ids': ids}
        return data
    except Exception, e:
        print_exc()
        return HTTPError()


@route("/json/packages", method="POST")  # FULL info for specifed packages
@route("/json/packages")
@route("/json/:dest/packages", method="POST")  # FULL info for specifed packages
@route("/json/:dest/packages")
@login_required('LIST')
def packages(**kwargs):
    if 'dest' in kwargs:
        dest = kwargs['dest']
    else:
        dest = None
    try:
        def pkg_items():
            if dest is None or dest == 'queue':
                packages = PYLOAD.getQueue()
            elif dest == 'collector':
                packages = PYLOAD.getCollector()
            else:
                raise Exception('Unknown dest: {}'.format(dest))

            for pid, pkg in ([pkg.pid, toDict(pkg)] for pkg in packages):
                if request.method == 'POST' and str(pid) in request.json[u'pids']:
                    # compliment links info
                    pkgdata = PYLOAD.getPackageData(pid)
                    # TODO consider to make toDict() reqursive
                    pkgdict = toDict(pkgdata)
                    pkgdict['links'] = [toDict(fileobj) for fileobj in pkgdict['links']]

                    # normolize status msg
                    for link in pkgdict['links']:
                        link['status'] = _invert_pyfile_status_map[link['status']]

                    yield pid, pkgdict
                elif request.method == 'GET':
                    del pkg['links']
                    yield pid, pkg


        dict_items = dict(pkg_items())
        for pkg in dict_items.values():
            pkg['dest'] = 'queue' if pkg['dest'] == 1 else 'collector'
        return dict_items

    except Exception as e:
        return HTTPError()


@route("/json/package/<id:int>")
@login_required('LIST')
def package(id):
    try:
        data = toDict(PYLOAD.getPackageData(id))
        data["links"] = [toDict(x) for x in data["links"]]

        for pyfile in data["links"]:
            pyfile['status'] = _invert_pyfile_status_map[pyfile['status']]

        tmp = data["links"]
        tmp.sort(key=get_sort_key)
        data["links"] = tmp
        return data

    except:
        print_exc()
        return HTTPError()


@route("/json/package_order/:ids")
@login_required('ADD')
def package_order(ids):
    try:
        pid, pos = ids.split("|")
        PYLOAD.orderPackage(int(pid), int(pos))
        return {"response": "success"}
    except:
        return HTTPError()


@route("/json/abort_link/<id:int>")
@login_required('DELETE')
def abort_link(id):
    try:
        PYLOAD.stopDownloads([id])
        return {"response": "success"}
    except:
        return HTTPError()


@route("/json/link_order/:ids")
@login_required('ADD')
def link_order(ids):
    try:
        pid, pos = ids.split("|")
        PYLOAD.orderFile(int(pid), int(pos))
        return {"response": "success"}
    except:
        return HTTPError()


@route("/json/parse_urls", method="POST")
def parse_urls():
    """
    Method parses source text and extract urls from em
    return: list og tuples (url, pos in src text, hoster, status, ...etc)
    """

    raw_text = request.json['raw_text']

    parsed_urls = []
    for plugin, urls in PYLOAD.parseURLs(raw_text).iteritems():
        for url in urls:
            parsed_urls.append({'url': url, 'plugin': plugin})
    return {'urls': parsed_urls}

@route("/json/restart_files", method="POST")
@login_required('MODIFY')
def restart_files():
    files_list = (int(fid) for fid in request.json[u'files_list'])
    for fid in files_list:
        PYLOAD.restartFile(fid)
    return {"response": "success"}

@route("/json/abort_files", method="POST")
@login_required('MODIFY')
def abort_files():
    files_list = (int(fid) for fid in request.json[u'files_list'])
    PYLOAD.stopDownloads(files_list)
    return {"response": "success"}

@route("/json/add_package")
@route("/json/add_package", method="POST")
@login_required('ADD')
def add_package():
    name = request.json[u'add_name']
    queue = 1 if request.json[u'destination'] == 'queue' else 0
    links = request.json[u'add_links']

    pw = request.json[u'add_password'].strip("\n\r") if u'add_password' in request.json else None

    try:
        f = request.files['add_file']

        if not name or name == "New Package":
            name = f.name

        fpath = join(PYLOAD.getConfigValue("general", "download_folder"), "tmp_" + f.filename)
        destination = open(fpath, 'wb')
        copyfileobj(f.file, destination)
        destination.close()
        links.insert(0, fpath)
    except:
        pass

    pack = PYLOAD.addPackage(name, links, queue)
    if pw:
        data = {"password": pw}
        PYLOAD.setPackageData(pack, data)

    return {"response": "success"}


@route("/json/move_package/<dest:int>/<id:int>")
@login_required('MODIFY')
def move_package(dest, id):
    try:
        PYLOAD.movePackage(dest, id)
        return {"response": "success"}
    except:
        return HTTPError()


@route("/json/edit_package", method="POST")
@login_required('MODIFY')
def edit_package():
    try:
        id = int(request.json[u"pack_id"])
        data = {
            "name": request.json[u"pack_name"],
            "folder": request.json[u"pack_folder"],
            "password": request.json[u"pack_pws"],
            "links": request.json[u"pack_links"],
        }

        PYLOAD.setPackageData(id, data)
        return {"response": "success"}

    except:
        return HTTPError()


@route("/json/set_captcha")
@route("/json/set_captcha", method="POST")
@login_required('ADD')
def set_captcha():
    if request.environ.get('REQUEST_METHOD', "GET") == "POST":
        try:
            PYLOAD.setCaptchaResult(request.forms["cap_id"], request.forms["cap_result"])
        except:
            pass

    task = PYLOAD.getCaptchaTask()

    if task.tid >= 0:
        src = "data:image/%s;base64,%s" % (task.type, task.data)

        return {'captcha': True, 'id': task.tid, 'src': src, 'result_type': task.resultType}
    else:
        return {'captcha': False}


@route("/json/load_config/:category/:section")
@login_required("SETTINGS")
def load_config(category, section):
    conf = None
    if category == "general":
        conf = PYLOAD.getConfigDict()
    elif category == "plugin":
        conf = PYLOAD.getPluginConfigDict()

    for key, option in conf[section].iteritems():
        if key in ("desc", "outline"): continue

        if ";" in option["type"]:
            option["list"] = option["type"].split(";")

        option["value"] = decode(option["value"])

    return render_to_response("settings_item.html", {"skey": section, "section": conf[section]})


@route("/json/save_config/:category", method="POST")
@login_required("SETTINGS")
def save_config(category):
    for key, value in request.POST.iteritems():
        try:
            section, option = key.split("|")
        except:
            continue

        if category == "general": category = "core"

        PYLOAD.setConfigValue(section, option, decode(value), category)


@route("/json/add_account", method="POST")
@login_required("ACCOUNTS")
def add_account():
    login = request.POST["account_login"]
    password = request.POST["account_password"]
    type = request.POST["account_type"]

    PYLOAD.updateAccount(type, login, password)


@route("/json/update_accounts", method="POST")
@login_required("ACCOUNTS")
def update_accounts():
    deleted = []  #dont update deleted accs or they will be created again

    for name, value in request.POST.iteritems():
        value = value.strip()
        if not value: continue

        tmp, user = name.split(";")
        plugin, action = tmp.split("|")

        if (plugin, user) in deleted: continue

        if action == "password":
            PYLOAD.updateAccount(plugin, user, value)
        elif action == "time" and "-" in value:
            PYLOAD.updateAccount(plugin, user, options={"time": [value]})
        elif action == "limitdl" and value.isdigit():
            PYLOAD.updateAccount(plugin, user, options={"limitDL": [value]})
        elif action == "delete":
            deleted.append((plugin, user))
            PYLOAD.removeAccount(plugin, user)


@route("/json/change_password", method="POST")
def change_password():
    user = request.POST["user_login"]
    oldpw = request.POST["login_current_password"]
    newpw = request.POST["login_new_password"]

    if not PYLOAD.changePassword(user, oldpw, newpw):
        print "Wrong password"
        return HTTPError()
