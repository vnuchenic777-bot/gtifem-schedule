/**
 * Скрипты для сайта gtifem.ru
 * @author Николаев Константин <nikolaev@twozebras.ru>
 */

$(function() {

	/**
	 * Всплыающие формы
	 */
	$(".fancybox-popup").fancybox({
		autoSize: true,
		padding: 0,
		margin: 0,
		closeBtn: false,

		tpl: {
			wrap: '<div class="fancybox-wrap" tabIndex="-1"><div class="fancybox-enter-wrap"><div class="fancybox-skin"><div class="fancybox-outer"><div class="fancybox-inner"></div></div></div></div></div>'
		},
		helpers: {
        overlay: {
            locked: false

    }
								  }
	});

	/**
	 * Увеличение картинок
	 */
	$(".fancybox").fancybox({
		autoSize: true,
		padding: 0,
		margin: 40,
		overlay: {
		locked: false
		},
		closeBtn: true,
		tpl: {
			wrap: '<div class="fancybox-wrap" tabIndex="-1"><div class="fancybox-enter-wrap"><div class="fancybox-skin"><div class="fancybox-outer"><div class="fancybox-inner"></div></div></div></div></div>'
		},
		helpers: {
        overlay: {
            locked: false

    }
								  }
	});

	/**
	 * Подгрузка новостей на главной
	 */
	var main_news_page = 1
	$('.main-items-section').on('click', '.main-items-section_more a', function(){
		main_news_page++;
		$.get(window.location.href, {
			page: main_news_page
		},
		function(data){
			var htmlFiltered = $(data).find("#main-news").html();
			$('#main-news').html(htmlFiltered);

			$('html, body').animate({
					scrollTop:   $('#main-news').height() -180
				},
				1000,
				'swing'
			);
			return false;
		});
		return false;
	});
	var main_news_pages = 1;
	$('.news-line').on('click', '.main-items-section_more a', function(){
		main_news_pages++;
		$.get(window.location.href, {
			pages: main_news_pages
		},
		function(data){
			var htmlFiltered = $(data).find(".news-line").html();
			$('.news-line').html(htmlFiltered);

			$('html, body').animate({
					scrollTop: $(document).height()
				},
				1000,
				'swing'
			);
			return false;
		});
		return false;
	});

	/**
	 * Библиотека файлов. Дерево разделов и элементов.
	 */
	var need_level, cur_level, status;
	//var last = $('.methodical-sheet-list .methodical-sheet tr[data-type="E"]').last();

	$('.methodical-sheet-list').on('click',' .methodical-sheet tr[data-type="S"]',function(){
		/*
		var last = $('.methodical-sheet-list .methodical-sheet tr[data-type="E"]').last();
		if(last.length  == 0) {
			var last_sect = $('.methodical-sheet-list .methodical-sheet tr[data-type="S"]').last();
		}
		console.log(last);
		*/
		cur_level = $(this).data('level');
		need_level = parseInt($(this).data('level') + 1);
		status = $(this).data('status');
		var id = $(this).data('section_id');
		var el = $(this).next(); //следующий элемент

		if(status == 'close') {
            $(this).data('status', 'open');
            $('tr[data-parent_section_id=' + id + ']').each(function (i) {
                $(this).toggleClass('show').toggleClass('hide');
            })
            $('tr[data-section_id=' + id + '][data-type=E]').each(function (i) {
                $(this).toggleClass('show').toggleClass('hide');
            })

        } else {

            hide_tree(id);
			/*
            $('tr[data-parent_section_id=' + id + ']').each(function (i,sect) {
                $(sect).toggleClass('show').toggleClass('hide');
                var sub_id = $(sect).data('section_id')
                console.log($(sect).data('status')+' -'+sub_id )

				if($(sect).data('status') == 'open'){
                    $('tr[data-parent_section_id=' + sub_id + ']').each(function (sub) {
                        $(sub).toggleClass('show').toggleClass('hide');

                    })
                    $('tr[data-section_id=' + sub_id + '][data-type=E]').each(function (el) {
                        $(el).toggleClass('show').toggleClass('hide');
                    })
                    $(sect).data('status', 'close');
				}
            })
            $('tr[data-section_id=' + id + '][data-type=E]').each(function (i) {
                $(this).toggleClass('show').toggleClass('hide');
            })
            $(this).data('status', 'close');
            */
		}
		/*
		if (el.length != 0) { //не последний элемент
			if (status == 'close') { //Открытие уровня

				$(this).data('status', 'open');
				while (el.data('level') != cur_level ) {
					if (el.data('level') == need_level) {
						el.removeClass('hide');
						el.addClass('show');
					}
					//if(el.is(last) ) break;

					el = el.next();
				}
			} else if (status == 'open') { //Закрывание уровня
				$(this).data('status', 'close');
				console.log(el.data('level'));
				while (el.data('level') != cur_level && cur_level < el.data('level')) {

					el.removeClass('show');
					el.addClass('hide');
					if (el.data('type') == 'S') {
						el.data('status', 'close');
					}
					if(el.is(last)) break;
					el = el.next();
				}
			}
		}
		*/
		return false;
	});
function hide_tree(sect_id) {
		$('tr[data-section_id='+sect_id+']').data('status', 'close');
            $('tr[data-parent_section_id=' + sect_id + ']').each(function (i,sub) {
            $(sub).removeClass('show').addClass('hide');
            if($(sub).data('status') == 'open'){

                hide_tree($(sub).data('section_id'));
            }
        })
        $('tr[data-section_id=' + sect_id + '][data-type=E]').each(function (i,el) {
            $(el).removeClass('show').addClass('hide');
        })

}
	//Поиск по дереву
	var search_word = '';
	$('.search-material #search').click(function(){
		var count = 0;
		var q = $('.search-material input[name="q"]').val().toLowerCase();
		if (q != search_word) {
			search_word = q;
			$('.search-material .methodical-sheet').html(''); //Удаляем старые результаты поиска

			$('.methodical-sheet-list .methodical-sheet tr[data-type="E"]').each(function(i, e){
				var name = $(this).find('.methodical-sheet__box_name').text().toLowerCase();
				var desc = $(this).find('.methodical-sheet__box_text').text().toLowerCase();
				if (name.indexOf(q) > -1 || desc.indexOf(q) > -1) {
					count++;
					$(this).removeClass('hide');
					$(this).find('.methodical-sheet__box').removeClass('marg_1').removeClass('marg_2').removeClass('marg_3').removeClass('marg_4');
					$('.search-material .methodical-sheet').append($(this).clone());
				}
			});
			$('.search-material .materials-list h2 span').text(count);
			$('.search-material .materials-list').show();
			$('.methodical-sheet-list').hide();
		}
		return false;
	});

	//Переход в нужный раздел при поиске по сайту
	if ($('.methodical-sheet-list').length > 0) {
		var section_id = window.location.hash;
		var cur_section_id = window.location.hash.substring(1);
		if (section_id != '') {
			var cur_level = $('.methodical-sheet-list .methodical-sheet tr#'+cur_section_id).data('level');
			if (typeof(cur_level) != 'undefined' && cur_level > 1) {
				for (var i = cur_level; i > 1; i--) {
					var parent_section_id = $('.methodical-sheet-list .methodical-sheet tr#'+cur_section_id).data('section_id');
					$('.methodical-sheet-list .methodical-sheet tr'+section_id).trigger('click');
							$('.methodical-sheet-list .methodical-sheet tr#s'+parent_section_id).trigger('click');
					cur_section_id = "s"+parent_section_id;
				}
			}

			$('html, body').animate({
				scrollTop: $('.methodical-sheet-list .methodical-sheet tr'+section_id).offset().top
			 }, 500);
		}
	}



	//Отправка файла на почту
	$('.methodical-sheet-list .methodical-sheet .download').click(function(){
		var file_id = $(this).data('file_id');
		var file_has = $(this).data('file_has');
		var dat = {
			method: "file2Email",
			file_id: file_id,
			file_has:file_has
		}
		$.getJSON("/ajax.php", dat, function(data){
			alert(data.text);
		});
		return false;
	});

	//Счетчик скачиваний
	$('.methodical-sheet .methodical-sheet__box_name a, .methodical-sheet .methodical-sheet__box_links a').click(function(){
		var id = $(this).parents('tr').data('id');
		$.getJSON("/ajax.php", {
			method: "downloadNum",
			id: id
		}, function(data){

		});
	});

	/**
	 * AJAX работа Расписания
	 */
	$('.content').on('click', '#raspisanie .filter li a', function() {
		var url = $(this).attr('href');
		$.ajax(url, {
			type: 'GET',
			cache: false,
			context: this,
			dataType: 'html',
			success: function(response){
				var htmlFiltered = $(response).find("#raspisanie").html();
				$('#raspisanie').html(htmlFiltered);
			}
		});
		return false;
	});
	/**
	 * Верхняя панель
	 */

	$(window).scroll(function(){
					 if ($(this).scrollTop() > 150){
						 $(".top-block").css({'width':'100%', 'position':'fixed','top':'0','z-index':'998'});
						 $(".header").css('margin-top','60px');
					 }else{
						$(".top-block").css('position','inherit');
						$(".header").css('margin-top','0px');
					 }
	});

	/**
	 * Меню
	 */

	$('.block').click(function () {
		$(".block").css("left","-9999px");
		$(".navi .menu").css({"opacity": "1"," z-index": "888","left":" 0px"});
	});
$(".navi").hover(function() {
},function(){
	$(".block").css("left","20px");
	$(".navi .menu").css({"opacity": "0"," z-index": "0","left":" -99999px"});
});



$(function(){
$(document).on("touchstart",function(event) {


	if($(event.target).closest(".menu,.navi").length) return;
    $(".block").css("left","0px");
	$(".navi .menu").css({"opacity": "0"," z-index": "0","left":" -99999px"});
    event.stopPropagation();
  });

});


	/**
	 * Кнопка Наверх
	 */
	$(window).scroll(function(){
		if ($(this).scrollTop() > 450){
			$(".verh").addClass("floating");
		} else {
			$(".verh").removeClass("floating");
		}
	});
	  $('.verh').click(function () {
        $('body,html').animate({
            scrollTop: 0
        }, 250);
        return false;
    });

	/**
	 * Кнопка Отзывы
	 */

function getCookie(name) {
	var cookie = " " + document.cookie;
	var search = " " + name + "=";
	var setStr = null;
	var offset = 0;
	var end = 0;
	if (cookie.length > 0) {
		offset = cookie.indexOf(search);
		if (offset != -1) {
			offset += search.length;
			end = cookie.indexOf(";", offset)
			if (end == -1) {
				end = cookie.length;
			}
			setStr = unescape(cookie.substring(offset, end));
		}
	}
	return(setStr);
}
var display = getCookie("display");
var date = new Date(new Date().getTime() + 1800 * 1000);
if (display!=="none") {
	$('.divtop').toggleClass('deactive');
};	
$(function(){
$(".divtop_close").click(function(){
$('.divtop').toggleClass('deactive');
document.cookie = "display=none; expires="+date.toUTCString() ;
})
})


});

   

$(document).ready(function(){
var alt = $('.imagesub img').attr('alt');
var width = $('.imagesub img').attr('width');
$('.imagesub span').parent('.imagesub').children('span').text(alt);
$('.imagesub').width(width);
$('.imagesub span').width(width);


});
function base64_decode( data ) {	// Decodes data encoded with MIME base64
	// 
	// +   original by: Tyler Akins (http://rumkin.com)


	var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
	var o1, o2, o3, h1, h2, h3, h4, bits, i=0, enc='';

	do {  // unpack four hexets into three octets using index points in b64
		h1 = b64.indexOf(data.charAt(i++));
		h2 = b64.indexOf(data.charAt(i++));
		h3 = b64.indexOf(data.charAt(i++));
		h4 = b64.indexOf(data.charAt(i++));

		bits = h1<<18 | h2<<12 | h3<<6 | h4;

		o1 = bits>>16 & 0xff;
		o2 = bits>>8 & 0xff;
		o3 = bits & 0xff;

		if (h3 == 64)	  enc += String.fromCharCode(o1);
		else if (h4 == 64) enc += String.fromCharCode(o1, o2);
		else			   enc += String.fromCharCode(o1, o2, o3);
	} while (i < data.length);

	return enc;
}
