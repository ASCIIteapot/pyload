/**
 * Created by Developer on 28.07.14.
 */
function onPackageActionClick(elem){
    var action_type = $(elem.currentTarget).attr('data-action');
    var pid = $(elem.currentTarget).attr('data-pid');
    console.log(action_type, pid);

    if(action_type == 'edit_package'){
        editPackage(pid);
    }
}

function editPackage(pid, anchor){
    console.log(packageEditorModalInstance);
    packageEditorModalInstance.beginEditPackage(pid, anchor);
    $('#edit_package_modal').modal();
}