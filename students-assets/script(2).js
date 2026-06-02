var special = '';
var course = '';
var group = '';
var month = '';
$(document).ready(function () {

    $('.section.first a').click(function () {
        var ID = $(this).data('id');

        if(parseInt(ID) == 2322 ){
            special = 'Технологи';
            $('.timetable-page .table').empty();
            $('.filter .section:gt(1)').hide();
            $('.special').removeClass('active');
            $('.filter li').removeClass('active');
            $(this).parent('li').addClass('active');
            $('.filter .section:gt(0) li').removeClass('active');
            $(this).parent('li').addClass('active');
            $('.courses').show();
            $('.course').hide();
            $('.course' + ID).show();
            special = $(this).text();


            $('.specials').hide();
            return false;
        } else {
            $('.filter .section:not(:first)').hide();
            $('.timetable-page .table').empty();
            $('.filter li').removeClass('active');
            $(this).parent('li').addClass('active');

            $('.specials').css('display', 'block');
            $('.special').hide();
            $('.special' + ID).show();
            return false;
        }
    });

    $('.special a').click(function () {
        var ID = $(this).data('id');

            $('.timetable-page .table').empty();
            $('.filter .section:gt(1)').hide();
            $('.special').removeClass('active');
            $('.filter .section:gt(0) li').removeClass('active');
            $(this).parent('li').addClass('active');
            $('.courses').show();
            $('.course').hide();
            $('.course' + ID).show();
            special = $(this).text();
            return false;

    });
    $('.course a').click(function () {

        $('.course').removeClass('active');
        $('.timetable-page .table').empty();
        $(this).parents('li').addClass('active');
        $('.filter .section:gt(3)').hide();
        $('.groups .values ul').empty();
        if(special == 'Технологи'){
            $('.groups .values ul').empty();
            $(this).parent('li').addClass('active');

            course = $(this).parent('li').data('course');
            $.ajax({
                type: "POST",
                url: window.location.href,
                data: {
                    special: 'Технологи',
                    course :course,
                },
                dataType: 'json',
                success: function(msg){

                    msg.forEach(function (i,t) {
                        $('.groups .values ul').append('<li class="gr"><a href="#" data-group="'+i[1]+'">'+i[0]+'</a></li>');
                    })
                    $('.groups').show();
                }
            });
            return false;
        }else {


        $('.course').removeClass('active');
        $('.timetable-page .table').empty();
        $(this).parents('li').addClass('active');
        $('.filter .section:gt(3)').hide();
        $('.groups .values ul').empty();
        course = $(this).parent('li').data('course');
        $.ajax({
            type: "POST",
            url: window.location.href,
            data: {
                special: special,
                course :course
            },
            dataType: 'json',
            success: function(msg){

                msg.forEach(function (i,t) {
                    $('.groups .values ul').append('<li class="gr"><a href="#" data-group="'+i[1]+'">'+i[0]+'</a></li>');

                })

                $('.groups').show();
            }
        });
        return false;
        }
    })
    $('.groups').on('click','.gr a',function () {
        $('.timetable-page .table').empty();
        $('.gr').removeClass('active');
        group = $(this).text();
        $('.months .values ul').empty();
        $(this).parent('li').addClass('active')
        $.ajax({
            type: "POST",
            url: window.location.href,
            data: {
                special: special,
                course :course,
                group: group,
            },
            dataType: 'json',
            success: function(msg){

                msg.forEach(function (i,t) {
					console.log(i,t);
                    $('.months .values ul').append('<li class="month"><a href="#">'+i+'</a></li>');
                })
                $('.months').show();
            }
        });
        return false;
    })

    $('.months').on('click','.month a',function () {
        $('.month').removeClass('active');
        month = $(this).text();
        $(this).parent('li').addClass('active')
        $.ajax({
            type: "POST",
            url: window.location.href,
            data: {
                special: special,
                course :course,
                group: group,
                month: month,
            },
            dataType: 'html',
            success: function(msg){

                $('.timetable-page .table').html(msg);

            }
        });
        return false;
    })
})