document.addEventListener("DOMContentLoaded", () => {

  sc_options = {
    text: 'Мы используем файлы cookie. <a target="_blank" href="/private-policy/">Подробнее</a>',
//    imgUrl: "/smart-cookies/img/cookie.svg",
    textButton: "Принять",
  };

  function getCookie(name) {
    let matches = document.cookie.match(
      new RegExp(
        "(?:^|; )" +
          name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, "\\$1") +
          "=([^;]*)",
      ),
    );
    return matches ? decodeURIComponent(matches[1]) : undefined;
  }

  function setCookie(name, value, options = {}) {
    options = {
      path: "/",
      // при необходимости добавьте другие значения по умолчанию
      ...options,
    };

    if (options.expires instanceof Date) {
      options.expires = options.expires.toUTCString();
    }

    let updatedCookie =
      encodeURIComponent(name) + "=" + encodeURIComponent(value);

    for (let optionKey in options) {
      updatedCookie += "; " + optionKey;
      let optionValue = options[optionKey];
      if (optionValue !== true) {
        updatedCookie += "=" + optionValue;
      }
    }

    document.cookie = updatedCookie;
  }

  let sc_widget = function (options) {
    if (options) {
      let sc_widget = document.createElement("div");
      let sc_widget_text = document.createElement("div");
//      let sc_widget_img = document.createElement("img");
      let sc_agree_button = document.createElement("button");
      let sc_agree_text = document.createTextNode(options.textButton);

      sc_widget.className = "sc-widget";

      // Текст
      sc_widget_text.className = "sc-widget__text";
      sc_widget_text.innerHTML = options.text;
      
      // Кнопка
      sc_agree_button.className = "sc-widget__button button-dis button-dis--red btn";
      sc_agree_button.append(sc_agree_text);

      // Картинка
/*
      sc_widget_img.className = "sc-widget__img";
      sc_widget_img.setAttribute("src", options.imgUrl);
      sc_widget_img.setAttribute("width", "40");
      sc_widget_img.setAttribute("height", "40");

      sc_widget.append(sc_widget_img);
*/
      sc_widget.append(sc_widget_text);
      sc_widget.append(sc_agree_button);

      sc_agree_button.onclick = () => {
        setCookie('sc_cookies', true);
        sc_widget.remove();
      }

      document.body.append(sc_widget);
    }
  };

  if (!getCookie("sc_cookies")) {
    sc_widget(sc_options);
  } else {
    console.log(getCookie("sc_cookies"));
  }

  
});
