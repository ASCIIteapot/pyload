/**
 * Created by Developer on 28.07.14.
 */
function onPackageActionClick(action_type, package_item){
    var pid = package_item.pid;
    console.log(action_type, pid);

    if(action_type == 'edit_package'){
        editPackage(pid);
    }
    else if(action_type == 'remove_package'){
        DoAjaxJsonRequest({
            url: '/api/deletePackages',
            data: { args: [[pid]]}
        }, 'Удаление пакета '+pid);
    }
    else if(action_type == 'move_package'){
        var dst = package_item.dest;
        if(dst == 'queue'){
            dst = 0;
        }
        else{
            dst = 1;
        }
        DoAjaxJsonRequest({
            method: 'GET',
            url: '/json/move_package/' + dst +'/' +pid
        }, 'Перемещение пакета')
    }
    else if(action_type == 'restart_all'){
        DoAjaxJsonRequest({
            url: '/json/restart_package',
            data: { packages_list: [pid]}
        }, 'Перезапуск всех файлов в пакете '+pid);
    }
    else if(action_type == 'restart_errors'){
        DoAjaxJsonRequest({
            url: '/json/restart_package',
            data: { packages_list: [pid], restart_condition: ['error']}
        }, 'Перезапуск ошибочных файлов в пакете '+pid);
    }
    else if(action_type == 'restart_errors_and_wait'){
        DoAjaxJsonRequest({
            url: '/json/restart_package',
            data: { packages_list: [pid], restart_condition: ['error', 'waiting']}
        }, 'Перезапуск ошибочных и лжидающих файлов в пакете '+pid);
    }
    else if(action_type == 'abort_package'){
        DoAjaxJsonRequest({
            url: '/json/abort_packages',
            data: { packages_list: [pid]}
        }, 'Остановка всех файлов в пакете '+pid);
    }
}

function editPackage(pid, anchor){
    console.log(packageEditorModalInstance);
    packageEditorModalInstance.beginEditPackage(pid, anchor);
    $('#edit_package_modal').modal();
}