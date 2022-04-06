var layer;
var g_list = [];

$(function() {
    layui.use(function() {
        layer = layui.layer,
            form = layui.form,
            laypage = layui.laypage,
            element = layui.element,
            laydate = layui.laydate,
            util = layui.util,
            form = layui.form,
            dropdown = layui.dropdown;
        var upload = layui.upload;

        var uploadInst = upload.render({
            elem: '#uploadImage',
            auto: false,
            accept: 'images',
            acceptMime: 'image/*',
            size: 102400, //限制文件大小10M
            multiple: false,
            choose: function(obj) {
                obj.preview(function(index, file, result) {
                    $('#uploadTip').addClass('layui-hide');
                    $('#uploadPreview').removeClass('layui-hide').find('img').attr('src', result);
                });
            },
        });

        // dropdown.on('click(site_item)', function(options) {
        //     var ele = $(this);
        //     var site = ele.data('site');
        //     g_site.currentSite = site;
        // });
        initContextmenu();
        $(document)
            .on('click', '[data-action]', function(event) {
                doAction(this, this.dataset.action, event);
            })
    });

});

function initContextmenu() {
    layui.dropdown.render({
        elem: '#list li',
        trigger: 'contextmenu',
        data: [{
            title: '下载',
            id: 'download'
        }],
        click: function(data, othis) {
            var elem = $(this.elem),
                site = elem.data('name');
            switch (data.id) {
                case 'download':
                    downloadUrl(g_api+'dbs/'+site+'.db');
                    if(g_list.includes(site+'_thumbs.db')){
                        layer.confirm('是否下载缩略图数据库?', {icon: 3, title:'提示'}, function(index){
                            downloadUrl(g_api+'dbs/'+site+'_thumbs.db');
                          layer.close(index);
                        });
                    }
                    break;
            }
        }
    });

}


function downloadUrl(url) {
    console.log(url);
    var eleLink = document.createElement('a');
    var a = url.split('/');
    eleLink.download = a[a.length - 1];
    eleLink.style.display = 'none';
    eleLink.href = url;
    document.body.appendChild(eleLink);
    eleLink.click();
    document.body.removeChild(eleLink);
}

function doAction(dom, action, event) {
    var action = action.split(',');
    // if (g_actions[action[0]]) {
    //     g_actions[action[0]](dom, action, event);
    // }
    switch (action[0]) {
        case 'refresh':
            g_site.db_loadList();
            break;
        case 'search':
            g_site.submit();
            break;

        case 'upload':
            layer.open({
                title: '上传数据库',
              type: 2, area: ['500px', '350px'],
              content: ['upload.html', 'no'],
            }); 

            break;
        case 'site_add':
            g_site.editSite();

            break;

        case 'minSize':
            ipc_send('min');
            break;

        case 'maxSize':
            ipc_send('max');
            break;

        case 'close':
            ipc_send('close');
            break;
    }
}