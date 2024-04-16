const { Plugin, Menu, getFrontend, fetchPost} = require('siyuan');

module.exports = class ExamplePlugin extends Plugin {
    email_notebook = null;

    onload() {
        const frontEnd = getFrontend();
        this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";

        const topBarElement = this.addTopBar({
            icon: "iconHelp",   // 使用图标库中的图标，可以在工作空间/conf/appearance/icons/index.html中查看内置图标
            title: 'Siyuan Example',
            position: "right",
            callback: () => {
                if (this.isMobile) {  
                    this.addMenu();
                } else {
                    let rect = topBarElement.getBoundingClientRect();
                    // 如果被隐藏，则使用更多按钮
                    if (rect.width === 0) {
                        rect = document.querySelector("#barMore").getBoundingClientRect();
                    }
                    if (rect.width === 0) {
                        rect = document.querySelector("#barPlugins").getBoundingClientRect();
                    }
                    this.addMenu(rect);
                }
            }

        });

        fetchPost("/api/notebook/lsNotebooks", {}, (response) => {
            const notebooks = response["data"]["notebooks"]
            for(let n in notebooks){
                if(notebooks[n]["name"] == "PluginDebug"){
                    this.email_notebook = notebooks[n]
                }
            }
        });
    }

    addMenu(rect) {
        const menu = new Menu("topBarSample");
        menu.addItem({
            icon: "iconInfo",
            label: "Console Help",
            click: () => {
                console.log('Help');
                fetchPost("/api/filetree/createDocWithMd", {
                    "notebook": this.email_notebook["id"],
                    "path": "email_test",
                    "markdown" : "# This is a title"
                })
            }
        });
        if (this.isMobile) {
            menu.fullscreen();
        } else {
            menu.open({
                x: rect.right,
                y: rect.bottom,
                isLeft: true,
            });
        }
    }
}
