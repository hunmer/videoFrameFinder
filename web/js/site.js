var g_api = 'http://127.0.0.1:1081/';
var g_site = {
    db_loadList: function() {
        $.get(g_api+'list', function(data) {
            var h = ``;
            g_list = data.list;
            for (var item of data.list) {
                if(item.substr(-10) == '_thumbs.db') continue;
                item = item.replace('.db', '');
                h += `
                    <li data-name="${item}">
                      <div class="layui-menu-body-title">${item}</div>
                    </li>`
            }
            $('#list').html(`
                <div class="layui-panel">
                  <ul class="layui-menu" id="site_item">
                  ${h}
                  </ul>
                </div>
            `);
        });
    },
    init: function() {
        this.db_loadList();
    },

    getSelectedDb: function(){
        return $('#site_item li.layui-menu-item-checked').data('name');
    },

    submit: function(){
        var db = this.getSelectedDb();
        if(db == undefined){
            return layer.msg('请选中要搜索的数据库');
        }
        var img = $('#uploadPreview img').attr('src');
        if(!img){
            return layer.msg('请先上传图片');
        }
        layer.load();
        $.post(g_api+'search', {img: img, database: db}, function(data, textStatus, xhr) {
            layer.closeAll('loading');
            var success = textStatus == 'success';
            layer.msg(success ? data.msg : '请求错误', {icon: success ? 6 : 5}); 

            var h = '';
            if(success){
                for(var item of data.data){
                    h += `
                    <div class="layui-col-md4 result_item" style="position: relative;">
                        <span class="layui-badge-rim layui-bg-green" style="position: absolute;border: unset;">${item.similarity}%</span>
                        <img class="mb-10" src="${item.preview}">
                        <b>${item.name}</b>
                    </div>`;
                }
            }
            $('#result').html(h);
        });
    },
}
g_site.init();