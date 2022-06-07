//feed-new-message-inf-text feed-new-message-inf-text-reload new-message-balloon
//feed-new-message-inf-text feed-new-message-inf-text-counter new-message-balloon
//document.getElementsByClassName("bx24-connection-status-text-reload-title")[0].click()
//

//>>>Переменные<<<//
let Deleted_posts_array = []    //Массив с id удаленных постов
let Nums_of_non_loaded_post = []  //Массив с количсетвом неудачных попыток скрыть пост, он может быть неподжгружен
let Minimum_number_of_posts = 5 //Количество минимальных постов на странице
let Posts_array = document.getElementsByClassName("feed-item-wrap")     //Cписок всех постов

//>>>Константы<<<//
const Resources = chrome.runtime.getURL("Resources")
const Manifest = chrome.runtime.getManifest()

const About_path = Resources + "/about.html"
const Settings_path = Resources + "/settings.html"

const FeedWrap = document.querySelectorAll(".feed-wrap")[1]   //Это основная стена, все посты являются детьми этого элемента
const PagetitleWrap = document.querySelectorAll(".pagetitle-wrap")[0]     //Это элемент над стеной с постами в нем содержится надпись "Новости", а данный аддон создает в нем меню с удаленными постами
const More_posts_button = document.getElementById("feed-new-message-inf-wrap-first")  //Кнопка "Ещё события"

//Для обратной совместимости
if (localStorage.getItem("DeletedPosts") != null) {    //Если в локальном хранилище есть такая переменная, значит аддон использовался до версии 3.5
    let Number_of_deleted_posts = parseInt(localStorage.getItem("DeletedPosts"))    //Получаем счетчик
    for (let i = 0; i < Number_of_deleted_posts; i++) { //Перебираем старые переменные в локальном хранилище
        Deleted_posts_array.push(localStorage.getItem("delpost" + i))   //Добавляем id в массив
        localStorage.removeItem("delpost" + i)    //И удаляем переменную из локального хранилища
    }
    localStorage.removeItem("DeletedPosts") //Удаляем переменную счетчика
    localStorage.setItem("Deleted_posts_array", Deleted_posts_array) //Ставим новую переменную с массивом
}
if (localStorage.getItem("Nums_of_non_loaded_post") == null & localStorage.getItem("Deleted_posts_array") != null) { //Если в локальном хранилище нет такой переменной, значит аддон использовался до версии 3.6 и ее требуется создать
    Deleted_posts_array = localStorage.getItem("Deleted_posts_array").split(',')
    for (i of Deleted_posts_array) {
        Nums_of_non_loaded_post.push(0)
    }
    localStorage.setItem("Nums_of_non_loaded_post", Nums_of_non_loaded_post)
}

//Загрузка данных из локального хранилища
function Get_data_from_localStorage() {
    if (Authorized()) {
        if (localStorage.getItem("Deleted_posts_array") != null & localStorage.getItem("Deleted_posts_array") != "") {
            Deleted_posts_array = localStorage.getItem("Deleted_posts_array").split(',')    //Помещаем id удаленных постов из локального хранилища в массив
            Nums_of_non_loaded_post = localStorage.getItem("Nums_of_non_loaded_post").split(',')    //Помещаем количество неудачных попыток скрыть посты в массив
            for (let i = 0; i < Nums_of_non_loaded_post.length; i++) {  //Делаем массив числовым
                Nums_of_non_loaded_post[i] = parseInt(Nums_of_non_loaded_post[i]) + 1
            }
            localStorage.setItem("Nums_of_non_loaded_post", Nums_of_non_loaded_post)    //Загружаем его в localStorage
        }
        if (localStorage.getItem("Minimum_Number_Of_Posts") != null) {
            Minimum_number_of_posts = parseInt(localStorage.getItem("Minimum_Number_Of_Posts"), 10)
        }
    }
}
Get_data_from_localStorage()

//Удаление постов
function Delete_posts() {
    if (Authorized()) {
        for (let i = 0; i < Deleted_posts_array.length; i++) {
            try {   // Пытаемся удалить данный пост(может быть ситуация что пост старый и он еще не загружен на страницу)
                if (document.getElementById(Deleted_posts_array[i]).parentNode.hidden == false) {  //Если данный элемент не скрыт, значит он загружен на страницу
                    if (Nums_of_non_loaded_post[i] > 0) {
                        Nums_of_non_loaded_post[i]--
                    }
                    localStorage.setItem("Nums_of_non_loaded_post", Nums_of_non_loaded_post)
                }
                document.getElementById(Deleted_posts_array[i]).parentNode.hidden = true
                Check_number_of_visible_posts()
            } catch (error) {
            }
        }
    }
}
Delete_posts()

//Создание крестиков
function Create_deleter() {
    let Post_deleter = document.querySelectorAll(".PostDeleter_PostDeleterDiv")    //Массив контейнеров с крестиками
    for (let i = 0; i < Post_deleter.length; i++) {    //Удаляем все крестики
        Post_deleter[i].remove()
    }
    for (Posts_array_item of Posts_array) {      // Перебираем все посты
        let Deleter_div = document.createElement("div")  //Создаем контейнер для крестика
        Deleter_div.className = "PostDeleter_PostDeleterDiv"
        let Deleter = document.createElement("button") //Создаем кнопку
        Deleter.className = "PostDeleter_PostDeleter"
        Deleter.onclick = function () {     //Функция нажатия на крестик
            Deleted_posts_array.push(this.parentNode.nextSibling.id)    //Добавляем в массив с удаленными постами id удаленого поста
            localStorage.setItem("Deleted_posts_array", Deleted_posts_array) //Обновляем список удаленных постов в локальном хранилище
            Nums_of_non_loaded_post.push(0)
            localStorage.setItem("Nums_of_non_loaded_post", Nums_of_non_loaded_post)    //Обновляем массив с количеством не-загрузок поста
            Deleter.parentNode.parentNode.hidden = true    //Удаляем пост
            Create_menu_with_deleted_posts()  //Пересоздаем меню со списком удаленных постов
            Check_number_of_visible_posts() //Проверяем количество видимых постов, чтобы не получилась пустая страница
        }
        let Deleter_image = document.createElement("div")   //Крестик для удаления поста
        Deleter_image.className = "PostDeleter_DeleterImage"
        Posts_array_item.insertBefore(Deleter_div, Posts_array_item.firstChild)
        Deleter_div.append(Deleter)
        Deleter.append(Deleter_image)
    }
}
Create_deleter()

//Функция создания контейнера для меню
function Create_div_for_menus() {
    if (Authorized()) {
        let Div_for_menus = document.createElement("div")
        Div_for_menus.id = "PostDeleter_DivForMenus"
        PagetitleWrap.append(Div_for_menus)
        Create_main_menu()
        Create_menu_with_deleted_posts()
    }
}
Create_div_for_menus()

//Функция для создания главного меню
function Create_main_menu() {
    try {   //Пытаемся удалить кнопку открывающую меню и само меню, т.к. иногда нужно пересоздавать меню
        document.getElementById("MainMenuDiv").remove()
        document.getElementById("PostDeleter_MainMenu").remove()
        document.getElementById("PostDeleter_AboutPostDeleter").remove()
        document.getElementById("PostDeleter_BackgroundFullScreenPostDeleter").remove()
        document.getElementById("PostDeleter_SettingsPostDeleter").remove()
    } catch (error) {
    }

    let About_PostDeleter = document.createElement("div") //Создание справки
    let Background_Fullscreen_PostDeleter = document.createElement("div")
    About_PostDeleter.id = "PostDeleter_AboutPostDeleter"
    Background_Fullscreen_PostDeleter.id = "PostDeleter_BackgroundFullScreenPostDeleter"
    Background_Fullscreen_PostDeleter.hidden = true
    About_PostDeleter.hidden = true
    document.body.append(Background_Fullscreen_PostDeleter, About_PostDeleter)
    let About_Posdeleter_body = document.createElement("div")
    let Get_about = new XMLHttpRequest
    Get_about.open("GET", About_path, true)
    Get_about.onload = function () {
        About_Posdeleter_body.innerHTML = Get_about.response
    }
    Get_about.send()
    About_Posdeleter_body.id = "PostDeleter_AboutBody"
    let About_Postdeleter_header = document.createElement("div")
    About_Postdeleter_header.id = "PostDeleter_AboutHeader"
    About_Postdeleter_header.innerHTML = "<h1>PostDeleter v" + Manifest.version + "</h1>"
    About_PostDeleter.append(About_Postdeleter_header, About_Posdeleter_body)
    let Close_about_button = document.createElement("button")
    Close_about_button.id = "PostDeleter_CloseAboutButton"
    Close_about_button.onclick = function () {
        Background_Fullscreen_PostDeleter.hidden = true
        About_PostDeleter.hidden = true
    }
    About_Postdeleter_header.append(Close_about_button)
    let Close_about_image = document.createElement("div")
    Close_about_image.id = "PostDeleter_CloseAboutImage"
    Close_about_button.append(Close_about_image)

    let Settings_PostDeleter_window = document.createElement("div")    //Создание окна настроек
    Settings_PostDeleter_window.id = "PostDeleter_SettingsPostDeleter"
    Settings_PostDeleter_window.hidden = true
    let Settings_header = document.createElement("div")
    Settings_header.id = "PostDeleter_SettingsHeader"
    Settings_header.innerHTML = "<h1>Настройки</h1>"
    Settings_PostDeleter_window.append(Settings_header)
    let Close_settings_button = document.createElement("button")
    Close_settings_button.id = "PostDeleter_CloseSettingsButton"
    Close_settings_button.onclick = function () {
        Background_Fullscreen_PostDeleter.hidden = true
        Settings_PostDeleter_window.hidden = true
    }
    Settings_header.append(Close_settings_button)
    let Close_settings_image = document.createElement("div")
    Close_settings_image.id = "PostDeleter_CloseSettingsImage"
    Close_settings_button.append(Close_settings_image)
    let Settings_body = document.createElement("div")
    Settings_body.id = "PostDeleter_SettingsBody"
    Settings_PostDeleter_window.append(Settings_body)
    let Get_settings = new XMLHttpRequest
    Get_settings.open("GET", Settings_path, true)
    Get_settings.onload = function () {
        Settings_body.innerHTML = Get_settings.response
        //Настройка настроек
        document.getElementById("PostDeleter_MinimumNumberOfPosts").value = Minimum_number_of_posts
        document.getElementById("PostDeleter_MinimumNumberOfPostsValue").innerText = Minimum_number_of_posts
    }
    Get_settings.send()
    let Settings_footer = document.createElement("div")
    Settings_footer.id = "PostDeleter_SettingsFooter"
    let Save_settings = document.createElement("button")
    Save_settings.id = "PostDeleter_SaveSettings"
    Save_settings.innerText = "Сохранить"
    Save_settings.onclick = function () {
        Minimum_number_of_posts = document.getElementById("PostDeleter_MinimumNumberOfPosts").value
        localStorage.setItem("Minimum_Number_Of_Posts", Minimum_number_of_posts)
        Check_number_of_visible_posts()
    }
    Settings_footer.append(Save_settings)
    Settings_PostDeleter_window.append(Settings_footer)
    document.body.append(Settings_PostDeleter_window)

    let Main_menu_div = document.createElement("div")   //Создание контейнера для кнопки, открывающей меню, и самого меню
    Main_menu_div.id = "MainMenuDiv"
    document.getElementById("PostDeleter_DivForMenus").insertBefore(Main_menu_div, document.getElementById("PostDeleter_DivForMenus").firstChild)

    let Main_menu_button = document.createElement("button") //Создание кнопки для открытия основного меню
    Main_menu_button.id = "PostDeleter_MainMenuButton"
    Main_menu_button.innerText = "Меню"
    Main_menu_button.onclick = function () { //Функция для открытия меню
        Main_menu_button.classList.toggle("PostDeleter_WhenMenuOpen")
        if (document.getElementById("PostDeleter_MainMenu").hidden == true) {
            document.getElementById("PostDeleter_MainMenu").hidden = false
        } else {
            document.getElementById("PostDeleter_MainMenu").hidden = true
        }
    }
    Main_menu_div.append(Main_menu_button)

    let Main_menu = document.createElement("div")   //Само меню
    Main_menu.id = "PostDeleter_MainMenu"
    Main_menu.className = "PostDeleterMenu"
    Main_menu.hidden = true
    Main_menu_div.append(Main_menu)

    let Settings_PostDeleter = document.createElement("div")
    Settings_PostDeleter.className = "PostDeleter_MainMenuItem"
    Settings_PostDeleter.innerText = "Настройки"
    Settings_PostDeleter.onclick = function () {
        Settings_PostDeleter_window.hidden = false
        Background_Fullscreen_PostDeleter.hidden = false
    }
    Main_menu.append(Settings_PostDeleter)
    Append_Strip(Main_menu)

    let Remove_old_posts = document.createElement("div")
    Remove_old_posts.className = "PostDeleter_MainMenuItem"
    Remove_old_posts.innerText = "Удаление старых данных"
    Remove_old_posts.onclick = function () {
        if (confirm("Вы хотите удалить данные о постах, которые портал не пытался загрузить 10 раз?")) {
            let Counter = 0
            for (let i = Nums_of_non_loaded_post.length - 1; i >= 0; i--) {
                if (Nums_of_non_loaded_post[i] >= 10) {
                    Counter++
                    Nums_of_non_loaded_post.splice(i, 1)
                    Deleted_posts_array.splice(i, 1)
                }
            }
            localStorage.setItem("Deleted_posts_array", Deleted_posts_array) //Обновляем список удаленных постов в локальном хранилище
            localStorage.setItem("Nums_of_non_loaded_post", Nums_of_non_loaded_post)    //Обновляем массив с количеством не-загрузок поста
            let pr
            if (((toString(Counter)[0] == '1' & toString(Counter)[1] == '1') | Counter == 1)) {
                pr = 'об'
            } else {
                pr = 'о'
            }
            if (Counter == 0) {
                alert("Таких постов нет")
            } else if (Counter % 10 == 1 & Counter % 100 != 11) {
                alert("Вы успешно удалили данные " + pr + " " + Counter + " посте")
            } else {
                alert("Вы успешно удалили данные " + pr + " " + Counter + " постах")
            }
        }
    }
    Main_menu.append(Remove_old_posts)
    Append_Strip(Main_menu)

    let Check_updates = document.createElement("div")   //Проверка обновлений расширения с Github
    Check_updates.className = "PostDeleter_MainMenuItem"
    Check_updates.innerText = "Проверка наличия обновлений"
    Check_updates.onclick = function () {
        let Get_github_info = new XMLHttpRequest;
        let Github_info
        Get_github_info.open("GET", "https://api.github.com/repos/SelskiySven/PostDeleter/releases", true);
        Get_github_info.onload = function () {
            Github_info = JSON.parse(Get_github_info.response)
            if (Manifest.version == Github_info[0].tag_name) {
                alert("Вы используете поледнюю версию PostDeleter")
            } else {
                if (confirm('Найдена новая версия, открыть страницу для скачивания?')) {
                    window.open(Github_info[0].html_url)
                }
            }
        }
        Get_github_info.send(null)
    }
    Main_menu.append(Check_updates)
    Append_Strip(Main_menu)

    let Clear_cache_div = document.createElement("div") //Очистка данных (если надо удалить аддон, то надо очистить данные в локальном хранилище)
    Clear_cache_div.className = "PostDeleter_MainMenuItem"
    Clear_cache_div.innerText = "Очистка данных"
    Clear_cache_div.id = "ClearCacheDiv"
    Clear_cache_div.onclick = function () { //Открытие меню с подтверждением действия
        if (confirm("Вы действительно хотите очистить данные?")) {
            localStorage.removeItem("Deleted_posts_array")
            localStorage.removeItem("Nums_of_non_loaded_post")
            localStorage.removeItem("Minimum_Number_Of_Posts")
            Nums_of_non_loaded_post = []
            Deleted_posts_array = []
            Create_menu_with_deleted_posts()
            alert("Данные успешно очищены")
        }
    }
    Main_menu.append(Clear_cache_div)

    let About_Div_Menu_item = document.createElement("div")   //Создание кнопки открытия справки
    About_Div_Menu_item.className = "PostDeleter_MainMenuItem"
    About_Div_Menu_item.innerText = "Справка"
    About_Div_Menu_item.id = "AboutPostDeleterMenuItem"
    About_Div_Menu_item.onclick = function () {
        Background_Fullscreen_PostDeleter.hidden = false
        About_PostDeleter.hidden = false
    }
    Append_Strip(Main_menu)
    Main_menu.append(About_Div_Menu_item)

    let Indent_div_2 = document.createElement("div")
    Indent_div_2.id = "PostDeleter_IndentDiv2"
    Main_menu.append(Indent_div_2)
}

function Append_Strip(elem) {    //Функция для добавления разделителя
    let Strip = document.createElement("hr")    //Создание тега hr для разделения элементов меню
    Strip.className = "PostDeleter_Strips"
    elem.append(Strip)
}

//Создание выпадающего меню с удаленными постами
function Create_menu_with_deleted_posts() {
    try {   //Пытаемся удалить кнопку открывающую меню и само меню, т.к. иногда нужно пересоздавать меню
        document.getElementById("MenuDeletedPostsDiv").remove()
        document.getElementById("PostDeleter_DropMenuDeletedPosts").remove()
    } catch (error) {
    }

    let Menu_deleted_posts_div = document.createElement("div")
    Menu_deleted_posts_div.id = "MenuDeletedPostsDiv"
    document.getElementById("PostDeleter_DivForMenus").append(Menu_deleted_posts_div)

    let Menu_button_deleted_posts = document.createElement("button")    //Кнопка открывающая меню
    Menu_button_deleted_posts.innerText = "Удаленные посты"
    Menu_button_deleted_posts.id = "PostDeleter_DeletedPostsMenu"
    Menu_button_deleted_posts.onclick = function () { //Функция открывающая и закрывающая меню
        Menu_button_deleted_posts.classList.toggle("PostDeleter_WhenMenuOpen")
        if (document.getElementById("PostDeleter_DropMenuDeletedPosts").hidden == true) {
            document.getElementById("PostDeleter_DropMenuDeletedPosts").hidden = false
        } else {
            document.getElementById("PostDeleter_DropMenuDeletedPosts").hidden = true
        }
    }
    Menu_deleted_posts_div.append(Menu_button_deleted_posts)

    let Deleted_posts_menu = document.createElement("div")    //Страница с меню
    Deleted_posts_menu.id = "PostDeleter_DropMenuDeletedPosts"
    Deleted_posts_menu.hidden = true
    Deleted_posts_menu.className = "PostDeleterMenu"
    Menu_deleted_posts_div.append(Deleted_posts_menu)
    let Deleted_posts_table_div = document.createElement("div")
    Deleted_posts_table_div.id = "PostDeleter_DeletedPostsTableDiv"
    Deleted_posts_menu.append(Deleted_posts_table_div)
    let Deleted_posts_table = document.createElement("table")
    Deleted_posts_table.id = "DeletedPostsTable"
    Deleted_posts_table_div.append(Deleted_posts_table)

    for (let i = Deleted_posts_array.length - 1; i >= 0; i--) {     //Строки меню
        let Deleted_posts_row = document.createElement("tr")    //Строка
        Deleted_posts_row.id = "DeletedPostRow" + i
        Deleted_posts_table.append(Deleted_posts_row)
        let Deleted_post_name = document.createElement("th")    // id поста
        Deleted_post_name.id = "PostDeleter_DeletedPostName" + i
        Deleted_post_name.className = "PostDeleter_DeletedPostName"
        Deleted_post_name.innerText = Deleted_posts_array[i]
        let Deleted_post_button = document.createElement("th")  //Место для кнопки
        Deleted_post_button.id = "DeletedPostButton" + i
        Deleted_posts_row.append(Deleted_post_name)
        Deleted_posts_row.append(Deleted_post_button)
        Deleted_post_button = document.createElement("button")  //Сама кнопка
        Deleted_post_button.innerText = "Вернуть"
        Deleted_post_button.onclick = function () { //Функция нажатия на кнопку "Вернуть"
            try {
                document.getElementById(Deleted_posts_array[i]).parentNode.hidden = false  //Делаем пост снова видимым
            } catch (error) {
            }
            Deleted_posts_array.splice(i, 1)    //Удаляем его из списка удаленных постов
            localStorage.setItem("Deleted_posts_array", Deleted_posts_array) //Обновляем массив с id удаленных постов в локальном хранилище
            Nums_of_non_loaded_post.splice(i, 1)
            localStorage.setItem("Nums_of_non_loaded_post", Nums_of_non_loaded_post)    //Обновляем массив с количеством не-загрузок поста
            this.parentNode.parentNode.remove() //Удаляем строку из меню
        }
        document.getElementById("DeletedPostButton" + i).append(Deleted_post_button)
    }
}

//Функция для подсчета количества отображаемых постов
function Check_number_of_visible_posts() {
    let Number_of_visible_posts = Posts_array.length
    for (Post of Posts_array) {
        if (Post.offsetWidth == 0 || Post.offsetHeight == 0) {   //Считаем количество отображаемых постов
            Number_of_visible_posts--
        }
    }
    if (Number_of_visible_posts < Minimum_number_of_posts) {   //Если отображаемых постов меньше 5, то зарпускаем триггер для загрузки дополнительных постов
        Add_more_posts()
    }
}

//Функция для загрузки новых постов
function Add_more_posts() {
    if (document.getElementById("LIVEFEED_search").value == "") { //Если в поиске ничего не набрано
        let h = pageYOffset
        let w = pageXOffset
        window.scroll(0, 0)
        setTimeout(() => {
            window.scroll(w, document.body.scrollHeight) //Опускаемся в самый низ
            setTimeout(() => {  //Через 100 милисекунд возвращаемся на предыдущую позицию
                window.scroll(w, h)
            }, 100);
        }, 100);
    }
}

function Create_observers() {
    if (Authorized()) {
        const Observer_posts = new MutationObserver(Post_has_been_added) //Наблюдатель за постами, необходим для того чтобы крестики появлялись на постах, появившихся в результаате нажатия на кнопку загруки новых сообщений 
        Observer_posts.observe(FeedWrap, config = {
            childList: true
        })

        const Observer_containers = new MutationObserver(Сontainer_has_been_added)  //Наблюдатель за контейнерами, необходим для того чтобы крестики появлялись на постах, появившихся в результате подгрузки старых постов
        Observer_containers.observe(document.getElementById("log_internal_container"), config = {
            childList: true
        })
    }
}
Create_observers()

function Create_observers_2() {
    if (Authorized()) {
        try {
            const Observer_more_posts_button = new MutationObserver(Try_click_more_posts_button)
            Observer_more_posts_button.observe(document.getElementById("feed-new-message-inf-wrap-first"), config = {
                attributes: true
            })
        } catch (error) {

        }
    }
}
Create_observers_2()

function Post_has_been_added() {     //Мультифункция на случай добавления нового поста
    setTimeout(() => {
        Create_deleter()
    }, 10);
}

function Сontainer_has_been_added() {    //Мультифункция на случай загрузки нового контейнера
    setTimeout(() => {
        Delete_posts()
        Create_deleter()
        Create_observers_2()
    }, 10);
}

function Try_click_more_posts_button() {
    try {
        document.getElementById("feed-new-message-inf-text-first").click()
    } catch (error) {
    }
}

function Authorized() { //Функция проверки, находимся ли мы на портали или странице авторизации
    if (Posts_array.length != 0) {
        return true
    } else {
        return false
    }
}