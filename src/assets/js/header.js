$(function () {
	/* ===== Base refs ===== */
	const $header = $('.header');
	const $searchToggle = $('#searchToggle');
	const $searchOverlay = $('#searchOverlay');
	const $searchClose = $('#searchClose');
	const $searchInput = $('#searchInput');
	const $cartToggle = $('#cartToggle');
	const $cartSidebar = $('#cartSidebar');
	const $cartClose = $('#cartClose');
	const $mobileMenuToggle = $('#mobileMenuToggle');
	const $mobileMenu = $('#mobileMenu');
	const $mobileMenuClose = $('#mobileMenuClose');

	const $dim = $('#globalDim').length ? $('#globalDim') : $('<div id="globalDim" />').appendTo('body');
	$('#searchOverlay, #cartSidebar, #mobileMenu').appendTo('body');

	let lastScrollTop = 0;
	let scrollTimeout = null;

	function lockBody(lock) {
		$('body').css('overflow', lock ? 'hidden' : '');
	}
	function anyLayerOpen() {
		return $cartSidebar.hasClass('active') || $searchOverlay.hasClass('active') || $mobileMenu.hasClass('active') || $('#submenuHost').hasClass('active');
	}
	function refreshDim() {
		const submenuOpen = $('#submenuHost').hasClass('active');
		$('body').toggleClass('submenu-open', submenuOpen); // 헤더 z-index 승격용
		$dim.toggleClass('active', anyLayerOpen());
		// 서브메뉴는 스크롤락 없음 (검색/카트/모바일만 락)
		lockBody($cartSidebar.hasClass('active') || $searchOverlay.hasClass('active') || $mobileMenu.hasClass('active'));
	}

	/* ===== Indicator (Tamburins-like) ===== */
	const $nav = $('.nav-menu');
	const $menuLinks = $('.menu-link');
	const $indicator = $('<span class="menu-indicator"></span>').appendTo($nav);
	let $activeLink = $menuLinks.filter('.is-active').first();
	let indicatorReady = !!$activeLink.length; // 첫 등장에서는 애니메이션 없음

	function moveIndicator($link, opts = {}) {
		if (!$link || !$link.length) {
			$nav.removeClass('has-active is-hover');
			$indicator.css({ width: 0, transform: 'translateX(0)' });
			return;
		}
		const { instant = false, color = 'active' } = opts;

		const navLeft = $nav.offset().left;
		const left = Math.round($link.offset().left - navLeft);
		const width = Math.round($link.outerWidth());

		if (instant) $indicator.addClass('no-anim');
		$indicator.css({ width, transform: `translateX(${left}px)` });

		if (color === 'hover') $nav.addClass('is-hover');
		else $nav.removeClass('is-hover');
		$nav.addClass('has-active');

		if (instant) {
			// 강제로 리플로우 후 클래스 제거하여 다음부턴 트랜지션 적용
			// eslint-disable-next-line no-unused-expressions
			$indicator[0].offsetWidth;
			$indicator.removeClass('no-anim');
		}
	}
	if ($activeLink.length) moveIndicator($activeLink, { instant: true, color: 'active' });

	/* ===== Scroll header hide (disabled when layers open) ===== */
	function handleScroll() {
		if (anyLayerOpen()) {
			$header.removeClass('hidden');
			return;
		}
		const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
		if (scrollTop > lastScrollTop && scrollTop > 100) $header.addClass('hidden');
		else $header.removeClass('hidden');
		lastScrollTop = scrollTop;
	}
	function debounce(fn, wait) {
		return function () {
			clearTimeout(scrollTimeout);
			scrollTimeout = setTimeout(() => fn.apply(this, arguments), wait);
		};
	}
	$(window).on('scroll', debounce(handleScroll, 10));

	/* ===== Search ===== */
	function toggleSearch() {
		if (!$searchOverlay.length) return;
		$searchOverlay.toggleClass('active');
		if ($searchOverlay.hasClass('active')) {
			$searchInput.trigger('focus');
			lockBody(true);
		} else {
			lockBody(false);
		}
		refreshDim();
	}
	$searchToggle.on('click', toggleSearch);
	$searchClose.on('click', toggleSearch);

	/* ===== Cart ===== */
	function toggleCart() {
		if (!$cartSidebar.length) return;
		$cartSidebar.toggleClass('active');
		lockBody($cartSidebar.hasClass('active'));
		refreshDim();
	}
	$cartToggle.on('click', toggleCart);
	$cartClose.on('click', toggleCart);

	/* ===== Mobile Menu ===== */
	function closeAllMobileSubmenus() {
		$('.mobile-submenu').removeClass('active');
		$('.mobile-menu-link').removeClass('active');
	}
	function toggleMobileMenu() {
		if (!$mobileMenu.length) return;
		$mobileMenu.toggleClass('active');
		$mobileMenuToggle.toggleClass('active');
		lockBody($mobileMenu.hasClass('active'));
		if (!$mobileMenu.hasClass('active')) closeAllMobileSubmenus();
		refreshDim();
	}
	$mobileMenuToggle.on('click', toggleMobileMenu);
	$mobileMenuClose.on('click', toggleMobileMenu);
	$('.mobile-menu-link').on('click', function (e) {
		e.preventDefault();
		const menuType = $(this).data('menu');
		const $mobileSubmenu = $(`[data-mobile-submenu="${menuType}"]`);
		$('.mobile-submenu').not($mobileSubmenu).removeClass('active');
		$('.mobile-menu-link').not(this).removeClass('active');
		if ($mobileSubmenu.length) {
			$mobileSubmenu.toggleClass('active');
			$(this).toggleClass('active');
		}
	});

	/* ===== Submenu Host (single, flicker-free) ===== */
	// 호스트는 항상 DOM에 존재(없으면 생성). 내부 높이 트윈을 위해 __inner 래퍼가 필요.
	const $submenuHost = $('#submenuHost').length
		? $('#submenuHost')
		: $(
				`<div id="submenuHost" class="submenu-host">
           <div class="submenu-host__inner"><!-- height tween target -->
             <div class="submenu-stage"></div>
           </div>
         </div>`
		  ).appendTo('body');

	const $hostInner = $submenuHost.find('.submenu-host__inner');
	const $stage = $submenuHost.find('.submenu-stage');

	// 템플릿 HTML 가져오기 (우선순위: #id -> .menu-item 내부 .submenu[data-submenu="id"])
	function getTplHtml(key) {
		if (!key) return '';
		const id = ('' + key).replace(/^#/, '');

		// 1) #id (template / div 등) 지원
		const $tpl = $('#' + id);
		if ($tpl.length) {
			let html = $tpl.data('html');
			if (!html) {
				// template 태그든 div든 통일해서 innerHTML 사용
				html = $tpl.html();
				$tpl.data('html', html);
				$tpl.empty(); // 중복 ID 방지 위해 비움
			}
			return html;
		}

		// 2) 기존 마크업 fallback: .submenu[data-submenu="id"]를 템플릿로 취급
		const $inline = $(`.menu-item .submenu[data-submenu="${id}"]`).first();
		if ($inline.length) {
			let html = $inline.data('html');
			if (!html) {
				html = $inline.html();
				$inline.data('html', html);
				$inline.empty();
			}
			return html;
		}

		return '';
	}

	// 컨텐츠만 교체 (호스트는 항상 유지) + 내부 높이 트윈 + 교차 페이드
	let swapping = false;
	let currentSubmenuKey = null;

	function swapSubmenuContentHtml(nextHtml, keyForState) {
		if (!nextHtml) return;
		if (swapping) return;
		if (currentSubmenuKey && keyForState && currentSubmenuKey === keyForState && $submenuHost.hasClass('active')) return;

		swapping = true;

		const $current = $stage.children('.submenu-panel');
		const $next = $('<div class="submenu-panel" />').html(nextHtml).appendTo($stage);

		// 겹쳐놓고 측정
		if ($current.length) $current.addClass('abs').css({ opacity: 1 });
		$next.addClass('abs').css({ opacity: 0 });

		const opening = !$submenuHost.hasClass('active');
		const nextH = $next.outerHeight();

		if (opening) {
			// 처음 열릴 때: 목표 높이를 먼저 적어두고 active 켜서 포인터만 허용
			$hostInner.height(nextH);
			$submenuHost.addClass('active');
		} else {
			// 열려있으면 현재 높이에서 다음 높이로 트윈
			const curH = $hostInner.outerHeight();
			if (Math.abs(curH - nextH) > 1) $hostInner.height(nextH);
		}

		// 교차 페이드 시작
		requestAnimationFrame(() => {
			$next.css({ opacity: 1 });
			if ($current.length) $current.css({ opacity: 0 });
		});

		// 이미지 로딩 후 높이 재보정
		const adjust = () => {
			const h = $next.outerHeight();
			if (Math.abs(h - $hostInner.height()) > 2) {
				$hostInner.stop(true, false).animate({ height: h }, 140, 'swing');
			}
		};
		$next.find('img').each(function () {
			if (this.complete) return;
			$(this).one('load', adjust);
		});
		setTimeout(adjust, 80);

		// 정리
		setTimeout(() => {
			if ($current.length) $current.remove();
			$next.removeClass('abs').css({ opacity: '' });
			// 높이 자동으로 돌려놓기 (다음 전환 전까지 자연 높이 유지)
			setTimeout(() => $hostInner.css('height', 'auto'), 10);
			currentSubmenuKey = keyForState || null;
			swapping = false;
		}, 240);
	}

	/* ===== Top menu: click to open/keep (close only via dim) [data-submenu] ===== */
	$(document).on('click', '.menu-link', function (e) {
		const $link = $(this);
		const href = $link.attr('href') || '';
		const key = $link.data('submenu'); // 예: data-submenu="submenu-dog" 또는 "#submenu-dog"

		if (key) {
			e.preventDefault();

			const html = getTplHtml(key);
			if (!html) return;

			// 활성 표시 전환
			$('.menu-link.is-active').not($link).removeClass('is-active').removeAttr('aria-current');
			$link.addClass('is-active').attr('aria-current', 'page');

			// 컨텐츠만 교체
			swapSubmenuContentHtml(html, ('' + key).replace(/^#/, ''));

			// 인디케이터(흰색) 이동
			$activeLink = $link;
			indicatorReady = true;
			moveIndicator($activeLink, { color: 'active' });

			refreshDim();
			return;
		}

		// 서브메뉴 없는 항목
		$('.menu-link.is-active').not($link).removeClass('is-active').removeAttr('aria-current');
		$link.addClass('is-active').attr('aria-current', 'page');

		$activeLink = $link;
		indicatorReady = true;
		moveIndicator($activeLink, { color: 'active' });

		if (href === '#' || href.startsWith('#')) e.preventDefault();
	});

	/* ===== Hover: only indicator/text highlight (no submenu open) ===== */
	$(document).on('mouseenter focusin', '.menu-link', function () {
		const $link = $(this);
		moveIndicator($link, { instant: !indicatorReady, color: 'hover' }); // 첫 호버는 instant
		indicatorReady = true;
	});
	$nav.on('mouseleave', function () {
		if ($activeLink && $activeLink.length) moveIndicator($activeLink, { color: 'active' });
		else {
			$nav.removeClass('has-active is-hover');
			$indicator.css({ width: 0, transform: 'translateX(0)' });
		}
	});

	/* ===== Dim closes only ===== */
	$dim.on('click', function () {
		if ($cartSidebar.hasClass('active')) {
			$('#cartClose').trigger('click');
			return;
		}
		if ($searchOverlay.hasClass('active')) {
			$('#searchClose').trigger('click');
			return;
		}
		if ($mobileMenu.hasClass('active')) {
			$('#mobileMenuClose').trigger('click');
			return;
		}

		if ($submenuHost.hasClass('active')) {
			$submenuHost.removeClass('active'); // 포인터만 죽임(호스트는 그대로)
			$hostInner.height(0); // 높이 닫힘
			$stage.empty(); // 패널 제거
			$('.menu-link.is-active').removeClass('is-active').removeAttr('aria-current');
			$activeLink = $();
			$nav.removeClass('is-hover');
			moveIndicator($activeLink); // 인디케이터 숨김
			currentSubmenuKey = null;
			refreshDim();
		}
	});

	/* ===== ESC closes search/cart/mobile only ===== */
	$(document).on('keydown', function (e) {
		if (e.key === 'Escape') {
			if ($searchOverlay.hasClass('active')) toggleSearch();
			if ($cartSidebar.hasClass('active')) toggleCart();
			if ($mobileMenu.hasClass('active')) toggleMobileMenu();
		}
	});

	/* ===== Search Enter ===== */
	$searchInput.on('keypress', function (e) {
		if (e.key === 'Enter') {
			const q = $.trim($(this).val());
			if (q) console.log('Search query:', q);
		}
	});

	/* ===== Touch: cart/mobile swipe ===== */
	let tSX = 0,
		tSY = 0,
		tEX = 0,
		tEY = 0;
	function handleTouchStart(e) {
		const t = e.originalEvent.changedTouches[0];
		tSX = t.screenX;
		tSY = t.screenY;
	}
	function handleTouchEnd(e) {
		const t = e.originalEvent.changedTouches[0];
		tEX = t.screenX;
		tEY = t.screenY;
		handleSwipe();
	}
	function handleSwipe() {
		const dx = tSX - tEX,
			dy = tSY - tEY,
			min = 50;
		if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > min) {
			if (dx > 0) {
				if ($cartSidebar.hasClass('active')) toggleCart();
			} else {
				if (!$cartSidebar.hasClass('active')) toggleCart();
			}
		}
		if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > min) {
			if (dy > 0) {
				if ($mobileMenu.hasClass('active')) toggleMobileMenu();
			}
		}
	}
	if ('ontouchstart' in window) {
		$(document).on('touchstart', handleTouchStart);
		$(document).on('touchend', handleTouchEnd);
	}

	/* ===== Demo cart ===== */
	let cartItems = [],
		cartCount = 0;
	function updateCartCount() {
		const $el = $('.cart-count');
		if ($el.length) $el.text(cartCount);
	}
	function updateCartDisplay() {
		const $c = $('.cart-content');
		if (!$c.length) return;
		if (!cartItems.length) {
			$c.html('<div class="cart-empty"><p>장바구니가 비어있습니다.</p></div>');
		} else {
			$c.html(
				cartItems
					.map(
						(it, i) => `
          <div class="cart-item">
            <div class="cart-item-info"><h4>${it.name}</h4><p>${it.price}</p></div>
            <button class="cart-item-remove" data-index="${i}">삭제</button>
          </div>`
					)
					.join('')
			);
		}
	}
	function addToCart(it) {
		cartItems.push(it);
		cartCount++;
		updateCartCount();
		updateCartDisplay();
	}
	function removeFromCart(i) {
		cartItems.splice(i, 1);
		cartCount--;
		updateCartCount();
		updateCartDisplay();
	}
	$(document).on('click', '.cart-item-remove', function () {
		const i = +$(this).data('index');
		if (!isNaN(i)) removeFromCart(i);
	});
	window.addToCart = addToCart;
	window.removeFromCart = removeFromCart;
	updateCartDisplay();

	/* ===== Header visibility observer ===== */
	const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
	if ('IntersectionObserver' in window) {
		const headerObserver = new IntersectionObserver(
			entries =>
				entries.forEach(e => {
					if (e.isIntersecting) $header.removeClass('hidden');
				}),
			observerOptions
		);
		const $mainContent = $('.main-content');
		if ($mainContent.length) headerObserver.observe($mainContent.get(0));
	}

	/* ===== Resize ===== */
	$(window).on('resize', function () {
		if ($(window).width() > 768 && $mobileMenu.hasClass('active')) toggleMobileMenu();
		moveIndicator($activeLink); // 메뉴 위치 재계산
	});

	console.log('Header functionality (Tamburins-like, data-submenu, no flicker) initialized');
	refreshDim();
});
