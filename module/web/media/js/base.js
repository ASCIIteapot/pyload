{%
    autoescape
    true %
}
var LoadJsonToContent, clear_captcha, humanFileSize, load_captcha, on_captcha_click, parseUri, root, set_captcha, submit_captcha;
root = this;
humanFileSize = function (f) {
    var c, d, e, b;
    d = new Array("B", "KiB", "MiB", "GiB", "TiB", "PiB");
    b = Math.log(f) / Math.log(1024);
    e = Math.floor(b);
    c = Math.pow(1024, e);
    if (f === 0) {
        return"0 B"
    } else {
        return Math.round(f * 100 / c) / 100 + " " + d[e]
    }
};
parseUri = function () {
    var b, c, g, e, d, f, a;
    b = $("add_links").value;
    g = new RegExp("(ht|f)tp(s?)://[a-zA-Z0-9-./?=_&%#]+[<| |\"|'|\r|\n|\t]{1}", "g");
    d = b.match(g);
    if (d === null) {
        return
    }
    e = "";
    for (f = 0, a = d.length; f < a; f++) {
        c = d[f];
        if (c.indexOf(" ") !== -1) {
            e = e + c.replace(" ", " \n")
        } else {
            if (c.indexOf("\t") !== -1) {
                e = e + c.replace("\t", " \n")
            } else {
                if (c.indexOf("\r") !== -1) {
                    e = e + c.replace("\r", " \n")
                } else {
                    if (c.indexOf('"') !== -1) {
                        e = e + c.replace('"', " \n")
                    } else {
                        if (c.indexOf("<") !== -1) {
                            e = e + c.replace("<", " \n")
                        } else {
                            if (c.indexOf("'") !== -1) {
                                e = e + c.replace("'", " \n")
                            } else {
                                e = e + c.replace("\n", " \n")
                            }
                        }
                    }
                }
            }
        }
    }
    return $("add_links").value = e
};
Array.prototype.remove = function (d, c) {
    var a, b;
    a = this.slice((c || d) + 1 || this.length);
    this.length = (b = d < 0) != null ? b : this.length + {from: d};
    if (this.length === 0) {
        return[]
    }
    return this.push.apply(this, a)
};
document.addEvent("domready", function () {
    root.notify = new Purr({mode: "top", position: "center"});
    root.captchaBox = new MooDialog({destroyOnHide: false});
    root.captchaBox.setContent($("cap_box"));
    root.addBox = new MooDialog({destroyOnHide: false});
    root.addBox.setContent($("add_box"));
    $("add_form").onsubmit = function () {
        $("add_form").target = "upload_target";
        if ($("add_name").value === "" && $("add_file").value === "") {
            alert('{{_("Please Enter a packagename.")}}');
            return false
        } else {
            root.addBox.close();
            return true
        }
    };
    $("add_reset").addEvent("click", function () {
        return root.addBox.close()
    });
    $("action_add").addEvent("click", function () {
        $("add_form").reset();
        return root.addBox.open()
    });
    $("action_play").addEvent("click", function () {
        return new Request({method: "get", url: "/api/unpauseServer"}).send()
    });
    $("action_cancel").addEvent("click", function () {
        return new Request({method: "get", url: "/api/stopAllDownloads"}).send()
    });
    $("action_stop").addEvent("click", function () {
        return new Request({method: "get", url: "/api/pauseServer"}).send()
    });
    $("cap_info").addEvent("click", function () {
        load_captcha("get", "");
        return root.captchaBox.open()
    });
    $("cap_reset").addEvent("click", function () {
        return root.captchaBox.close()
    });
    $("cap_form").addEvent("submit", function (a) {
        submit_captcha();
        return a.stop()
    });
    $("cap_positional").addEvent("click", on_captcha_click);
    return new Request.JSON({url: "/json/status", onSuccess: LoadJsonToContent, secure: false, async: true, initialDelay: 0, delay: 4000, limit: 3000}).startTimer()
});
LoadJsonToContent = function (a) {
    $("speed").set("text", humanFileSize(a.speed) + "/s");
    $("aktiv").set("text", a.active);
    $("aktiv_from").set("text", a.queue);
    $("aktiv_total").set("text", a.total);
    if (a.captcha) {
        if ($("cap_info").getStyle("display") !== "inline") {
            $("cap_info").setStyle("display", "inline");
            root.notify.alert('{{_("New Captcha Request")}}', {className: "notify"})
        }
    } else {
        $("cap_info").setStyle("display", "none")
    }
    if (a.download) {
        $("time").set("text", ' {{_("on")}}');
        $("time").setStyle("background-color", "#8ffc25")
    } else {
        $("time").set("text", ' {{_("off")}}');
        $("time").setStyle("background-color", "#fc6e26")
    }
    if (a.reconnect) {
        $("reconnect").set("text", ' {{_("on")}}');
        $("reconnect").setStyle("background-color", "#8ffc25")
    } else {
        $("reconnect").set("text", ' {{_("off")}}');
        $("reconnect").setStyle("background-color", "#fc6e26")
    }
    return null
};
set_captcha = function (a) {
    $("cap_id").set("value", a.id);
    if (a.result_type === "textual") {
        $("cap_textual_img").set("src", a.src);
        $("cap_title").set("text", '{{_("Please read the text on the captcha.")}}');
        $("cap_submit").setStyle("display", "inline");
        $("cap_textual").setStyle("display", "block");
        return $("cap_positional").setStyle("display", "none")
    } else {
        if (a.result_type === "positional") {
            $("cap_positional_img").set("src", a.src);
            $("cap_title").set("text", '{{_("Please click on the right captcha position.")}}');
            $("cap_submit").setStyle("display", "none");
            return $("cap_textual").setStyle("display", "none")
        }
    }
};
load_captcha = function (b, a) {
    return new Request.JSON({url: "/json/set_captcha", onSuccess: function (c) {
        return set_captcha(c)(c.captcha ? void 0 : clear_captcha())
    }, secure: false, async: true, method: b}).send(a)
};
clear_captcha = function () {
    $("cap_textual").setStyle("display", "none");
    $("cap_textual_img").set("src", "");
    $("cap_positional").setStyle("display", "none");
    $("cap_positional_img").set("src", "");
    return $("cap_title").set("text", '{{_("No Captchas to read.")}}')
};
submit_captcha = function () {
    load_captcha("post", "cap_id=" + $("cap_id").get("value") + "&cap_result=" + $("cap_result").get("value"));
    $("cap_result").set("value", "");
    return false
};
on_captcha_click = function (c) {
    var b, a, d;
    b = c.target.getPosition();
    a = c.page.x - b.x;
    d = c.page.y - b.y;
    $("cap_result").value = a + "," + d;
    return submit_captcha()
};
{%
    endautoescape %
}