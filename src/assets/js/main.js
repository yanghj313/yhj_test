const $slider = $('.best-seller-swiper');

$slider.slick({
	centerMode: true,
	centerPadding: '10vw',
	slidesToShow: 5,
	arrows: false,
	dots: false,
	infinite: true,
	autoplay: true,
	autoplaySpeed: 2200,
	speed: 600,
	cssEase: 'cubic-bezier(0.22,0.61,0.36,1)',
	swipeToSlide: true,
	focusOnSelect: true,
	responsive: [
		{
			breakpoint: 1200,
			settings: {
				slidesToShow: 3,
				centerMode: true,
				centerPadding: '12vw',
			},
		},
		{
			breakpoint: 768,
			settings: {
				slidesToShow: 1,
				centerMode: true,
				centerPadding: '16vw',
			},
		},
	],
});

$slider.on('click', '.slick-slide', function () {
	const idx = $(this).data('slick-index');
	const cur = $slider.slick('slickCurrentSlide');
	if (idx !== cur) $slider.slick('slickGoTo', idx);
});

$(document).on('keydown', e => {
	if (e.key === 'ArrowLeft') $slider.slick('slickPrev');
	if (e.key === 'ArrowRight') $slider.slick('slickNext');
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
