import {
    Plugin,
    showMessage,
    confirm,
    Dialog,
    Menu,
    openTab,
    adaptHotkey,
    getFrontend,
    getBackend,
    IModel,
    Setting,
    fetchPost,
    Protyle,
    openWindow,
    IOperation,
    Constants,
    openMobileFileById,
    lockScreen,
    ICard,
    ICardData
} from "siyuan";
import "./index.scss";

const STORAGE_NAME = "mail.setting"

const TAB_TYPE = "custom_tab";
const DOCK_TYPE = "dock_tab";

export default class PluginSample extends Plugin {

    private customTab: () => IModel;
    private isMobile: boolean;
    private blockIconEventBindThis = this.blockIconEvent.bind(this);

    onload() {
        this.data[STORAGE_NAME] = {
            'mail' : "your mail",
            'passwd' : "your passwd",
            'smtp_addr' : "smtp.yourmail.com",
            'smtp_port' : 465,
            'imap_addr' : "imap.yourmail.com",
            'imap_port' : 993,
        };

        const frontEnd = getFrontend();
        this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";
        // 图标的制作参见帮助文档
        this.addIcons(`
<symbol id="iconMailArchive" viewBox="0 0 32 32">
<path fill="#267cb5" style="fill: var(--color1, #267cb5)" d="M32 16c0 8.837-7.163 16-16 16s-16-7.163-16-16c0-8.837 7.163-16 16-16s16 7.163 16 16z"></path>
<path fill="#fff" style="fill: var(--color2, #fff)" d="M16 18.1l9.55-8.175c-0.15-0.1-0.35-0.175-0.55-0.175h-18c-0.2 0-0.4 0.075-0.55 0.175l9.55 8.175z"></path>
<path fill="#fff" style="fill: var(--color2, #fff)" d="M16.65 18.85c-0.375 0.325-0.925 0.325-1.3 0l-9.35-7.975v10.375c0 0.55 0.45 1 1 1h18c0.55 0 1-0.45 1-1v-10.4l-9.35 8z"></path>
</symbol>`);

        const topBarElement = this.addTopBar({
            icon: "iconMailArchive",
            title: this.i18n.addTopBarIcon,
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

        console.log(this.i18n.helloPlugin);
    }

    onLayoutReady() {
        this.loadData(STORAGE_NAME);
        console.log(`frontend: ${getFrontend()}; backend: ${getBackend()}`);
    }

    onunload() {
        console.log(this.i18n.byePlugin);
    }

    uninstall() {
        console.log("uninstall");
    }

    async updateCards(options: ICardData) {
        options.cards.sort((a: ICard, b: ICard) => {
            if (a.blockID < b.blockID) {
                return -1;
            }
            if (a.blockID > b.blockID) {
                return 1;
            }
            return 0;
        });
        return options;
    }

    openSetting() {
        const dialog = new Dialog({
            title: this.name,
            content: `<div class="b3-dialog__content"><textarea class="mail" class="b3-text-field fn__block" placeholder="your@email.com"></textarea></div>
<div class="b3-dialog__content"><textarea class="passwd" class="b3-text-field fn__block" placeholder="yourpasswd"></textarea></div>
<div class="b3-dialog__content"><textarea class="smtp_addr" class="b3-text-field fn__block" placeholder="smtp.yourmail.com"></textarea></div>
<div class="b3-dialog__content"><textarea class="smtp_port" class="b3-text-field fn__block" placeholder="465"></textarea></div>
<div class="b3-dialog__content"><textarea class="imap_addr" class="b3-text-field fn__block" placeholder="imap.yourmail.com"></textarea></div>
<div class="b3-dialog__content"><textarea class="imap_port" class="b3-text-field fn__block" placeholder="993"></textarea></div>
<div class="b3-dialog__action">
    <button class="b3-button b3-button--cancel">${this.i18n.cancel}</button><div class="fn__space"></div>
    <button class="b3-button b3-button--text">${this.i18n.save}</button>
</div>`,
            width: this.isMobile ? "92vw" : "520px",
        });
        const inputElements = dialog.element.querySelectorAll("textarea");
        const btnsElement = dialog.element.querySelectorAll(".b3-button");
        for(var element of inputElements){
            element.value = this.data[STORAGE_NAME][element.className];
            console.log(element.className);
            console.log(element.value);

            dialog.bindInput(element, () => {
                (btnsElement[1] as HTMLButtonElement).click();
            });
        }
        btnsElement[0].addEventListener("click", () => {
            dialog.destroy();
        });
        btnsElement[1].addEventListener("click", () => {
            let data = {};
            for (var element of inputElements) {
                data[element.className] =  element.value;
            }
            this.saveData(STORAGE_NAME, data);
            dialog.destroy();
        });
    }

    private eventBusPaste(event: any) {
        // 如果需异步处理请调用 preventDefault， 否则会进行默认处理
        event.preventDefault();
        // 如果使用了 preventDefault，必须调用 resolve，否则程序会卡死
        event.detail.resolve({
            textPlain: event.detail.textPlain.trim(),
        });
    }

    private eventBusLog({detail}: any) {
        console.log(detail);
    }

    private blockIconEvent({detail}: any) {
        detail.menu.addItem({
            iconHTML: "",
            label: this.i18n.removeSpace,
            click: () => {
                const doOperations: IOperation[] = [];
                detail.blockElements.forEach((item: HTMLElement) => {
                    const editElement = item.querySelector('[contenteditable="true"]');
                    if (editElement) {
                        editElement.textContent = editElement.textContent.replace(/ /g, "");
                        doOperations.push({
                            id: item.dataset.nodeId,
                            data: item.outerHTML,
                            action: "update"
                        });
                    }
                });
                detail.protyle.getInstance().transaction(doOperations);
            }
        });
    }

    private showDialog() {
        const dialog = new Dialog({
            title: `SiYuan ${Constants.SIYUAN_VERSION}`,
            content: `<div class="b3-dialog__content">
    <div>appId:</div>
    <div class="fn__hr"></div>
    <div class="plugin-sample__time">${this.app.appId}</div>
    <div class="fn__hr"></div>
    <div class="fn__hr"></div>
    <div>API demo:</div>
    <div class="fn__hr"></div>
    <div class="plugin-sample__time">System current time: <span id="time"></span></div>
    <div class="fn__hr"></div>
    <div class="fn__hr"></div>
    <div>Protyle demo:</div>
    <div class="fn__hr"></div>
    <div id="protyle" style="height: 360px;"></div>
</div>`,
            width: this.isMobile ? "92vw" : "560px",
            height: "540px",
        });
        new Protyle(this.app, dialog.element.querySelector("#protyle"), {
            blockId: "20200812220555-lj3enxa",
        });
        fetchPost("/api/system/currentTime", {}, (response) => {
            dialog.element.querySelector("#time").innerHTML = new Date(response.data).toString();
        });
    }

    private addMenu(rect?: DOMRect) {
        const menu = new Menu("topBarSample", () => {
            console.log(this.i18n.byeMenu);
        });
        menu.addItem({
            icon: "iconInfo",
            label: "Dialog(open help first)",
            click: () => {
                this.showDialog();
            }
        });

        menu.addSeparator();
        menu.addItem({
            icon: "iconSparkles",
            label: this.data[STORAGE_NAME].mail || "Readonly",
            type: "readonly",
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
