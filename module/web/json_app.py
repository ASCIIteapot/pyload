#!/usr/bin/env python
# -*- coding: utf-8 -*-

from traceback import print_exc
from shutil import copyfileobj

from os.path import join
from bottle import route, request, HTTPError, static_file
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

    def pakage_filter(pid):
        return True

    def check_for_full_info(pid):
        json = request.json if request.method == 'POST' else None
        if json is not None:
            if bool(json.get(u'all_full_info', False)):
                return True
            elif pid in (int(jpid) for jpid in json.get(u'pids', [])):
                return True
        return False

    try:
        def pkg_items():
            if dest is None or dest == 'queue':
                packages = PYLOAD.getQueue()
            elif dest == 'collector':
                packages = PYLOAD.getCollector()
            else:
                raise Exception('Unknown dest: {}'.format(dest))

            for pid, pkg in ([pkg.pid, toDict(pkg)] for pkg in packages if pakage_filter(pkg.pid)):
                if check_for_full_info(pid):
                    # compliment links info
                    pkgdata = PYLOAD.getPackageData(pid)
                    # TODO consider to make toDict() reqursive
                    pkg['links'] = [toDict(fileobj) for fileobj in pkgdata.links]

                    # normolize status msg
                    for link in pkg['links']:
                        link['status'] = _invert_pyfile_status_map[link['status']]

                    yield pid, pkg
                else:
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

@route("/json/restart_package", method="POST")
@login_required('MODIFY')
def restart_packages():
    packages_list = [int(fid) for fid in request.json.get(u'packages_list', [])]
    restart_condition = request.json.get(u'restart_condition', None)

    statusMap = {
            "finished":    None,
            "offline":     [u'error', u'waiting'],
            "online":      None,
            "queued":      None,
            "skipped":     None,
            "waiting":     [u'waiting'],
            "temp. offline": [u'error', u'waiting'],
            "starting":    None,
            "failed":      [u'error', u'waiting'],
            "aborted":     [u'error', u'waiting'],
            "decrypting":  None,
            "custom":      None,
            "downloading": None,
            "processing":  None,
            "unknown":     None,
        }

    appr_statuses = [PyFile.statusMap[key] for key, value in statusMap.iteritems() if (restart_condition is None) or (value is not None and set(value).intersection(set(restart_condition)))]

    def filter_func(pyfile):
        return pyfile.status in appr_statuses

    packages = [list(PYLOAD.getPackageData(pid).links) for pid in packages_list]
    files = sum(packages, [])
    files = filter(filter_func, files)
    for fid in (pyf.fid for pyf in files):
        PYLOAD.restartFile(fid)
    return {"response": "success"}

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

@route("/json/abort_packages", method="POST")
@login_required('MODIFY')
def abort_packages():
    packages_list = (int(pid) for pid in request.json[u'packages_list'])
    packages = [list(PYLOAD.getPackageData(pid).links) for pid in packages_list]
    pyfiles = [pyfile.fid for pyfile in sum(packages, [])]

    PYLOAD.stopDownloads(pyfiles)
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

    if request.json:
        PYLOAD.setCaptchaResult(request.json[u"cap_id"], request.json[u"cap_result"])
        return {'captcha': True}

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

@route("/json/get_captcha")
@route("/get_captcha/<tid:int>")
def get_captcha(**kwargs):
    if 'tid' in kwargs:
        task = PYLOAD.core.captchaManager.getTaskByID(int(kwargs['tid']))
        return static_file(task.captchaFile, root='')
    else:
        active_tasks = PYLOAD.getCaptchaTasks()
        def conv_func(captcha_task):
            true_task = PYLOAD.core.captchaManager.getTaskByID(captcha_task.tid)
            plugin = true_task.plugin
            pyfile = plugin.pyfile
            pypackage = pyfile.package()

            ret_dict = {
                'url': '/get_captcha/{}'.format(captcha_task.tid),
                'file': {'fid': pyfile.id, 'name': pyfile.name},
                'package': {'pid': pypackage.id, 'name': pypackage.name},
                'plugin': plugin.__name__
            }

            return captcha_task.tid, ret_dict
        return dict(map(conv_func, active_tasks))


@route("/json/load_config_list")
@login_required("SETTINGS")
def load_config_list():
    def tune_dict(conf_dict):
        newDict = dict(conf_dict)
        for key, value in newDict.items():
            activated = 'undefined'
            if 'activated' in value:
                activated = value['activated']['value']

            newDict[key] = {'activated': activated}
        return newDict
    conf_dict = {
        "general": tune_dict(PYLOAD.getConfigDict()),
        "plugin": tune_dict(PYLOAD.getPluginConfigDict())
    }
    return conf_dict

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

    return conf[section]

@route("/json/save_config/:category/:section", method="POST")
@login_required("SETTINGS")
def save_config(category, section):
    if category == "general": category = "core"
    for option, value in request.json.iteritems():
        PYLOAD.setConfigValue(section, option, decode(value), category)
    return {'success': True}

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
