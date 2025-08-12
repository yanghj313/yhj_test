const $slider = $('.best-seller-swiper');

$slider.slick({
	centerMode: true,
	centerPadding: '0px',
	slidesToShow: 5,
	slidesToScroll: 1,
	arrows: false,
	dots: false,
	infinite: true,
	autoplay: true,
	autoplaySpeed: 3000,
	pauseOnHover: true,
	pauseOnFocus: true,
	speed: 800,
	cssEase: 'cubic-bezier(0.22,0.61,0.36,1)',
	waitForAnimate: false,
	swipeToSlide: true,
	focusOnSelect: true,
	responsive: [
		{ breakpoint: 1440, settings: { slidesToShow: 3, centerMode: true, centerPadding: '0px' } },
		{ breakpoint: 768, settings: { slidesToShow: 1, centerMode: true, centerPadding: '16vw' } },
	],
});

$slider.on('click', '.slick-slide', function () {
	const idx = $(this).data('slick-index');
	const cur = $slider.slick('slickCurrentSlide');
	if (idx !== cur) $slider.slick('slickGoTo', idx);
});

$(document).keydown(function (e) {
	if (e.keyCode === 37) {
		$('.best-seller-swiper').slick('slickPrev');
	} else if (e.keyCode === 39) {
		$('.best-seller-swiper').slick('slickNext');
	}
});

var customCursor = document.getElementById('cursor'),
	customCursorText = $('#cursor .en-txt');

document.addEventListener('pointermove', e => {
	customCursor.style.left = e.clientX + 'px';
	customCursor.style.top = e.clientY + 'px';
});

document.onmouseover = function (e) {
	if (e.target.matches('.cursor_cont.drag') || e.target.closest('.cursor_cont.drag')) {
		customCursor.classList.add('act');
		document.body.classList.add('hide-cursor');
		$('#cursor .en-txt').text('DRAG');
		if (e.target.matches('.slick-arrow') || e.target.closest('.slick-arrow')) {
			customCursor.classList.remove('act');
			document.body.classList.remove('hide-cursor');
		}
	}
};
document.onmouseout = function (e) {
	if (e.target.matches('.cursor_cont') || e.target.closest('.cursor_cont')) {
		customCursor.classList.remove('act');
		document.body.classList.remove('hide-cursor');
	}
};
