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
}

function editPackage(pid, anchor){
    console.log(packageEditorModalInstance);
    packageEditorModalInstance.beginEditPackage(pid, anchor);
    $('#edit_package_modal').modal();
}