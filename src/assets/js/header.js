$(function () {
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
		$('body').toggleClass('submenu-open', submenuOpen);
		$dim.toggleClass('active', anyLayerOpen());

		lockBody($cartSidebar.hasClass('active') || $searchOverlay.hasClass('active') || $mobileMenu.hasClass('active'));
	}

	const $nav = $('.nav-menu');
	const $menuLinks = $('.menu-link');
	const $indicator = $('<span class="menu-indicator"></span>').appendTo($nav);
	let $activeLink = $menuLinks.filter('.is-active').first();
	let indicatorReady = !!$activeLink.length;

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
			$indicator[0].offsetWidth;
			$indicator.removeClass('no-anim');
		}
	}
	if ($activeLink.length) moveIndicator($activeLink, { instant: true, color: 'active' });

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

		// ✅ 검색 열릴 때 서브메뉴 호스트 닫기
		if ($searchOverlay.hasClass('active')) closeSubmenuHost();

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

		// ✅ 장바구니 열릴 때 서브메뉴 호스트 닫기
		if ($cartSidebar.hasClass('active')) closeSubmenuHost();

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

		const opening = !$mobileMenu.hasClass('active');
		if (opening) closeSubmenuHost(); // ✅ 햄버거 열릴 때도 닫기

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

	/* ===== Submenu Host ===== */
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

	// ✅ 서브메뉴 호스트 닫기 헬퍼
	function closeSubmenuHost() {
		if (!$submenuHost.length) return;
		if ($submenuHost.hasClass('active')) {
			$submenuHost.removeClass('active');
			$hostInner.height(0);
			$stage.empty();
			$('.menu-link.is-active').removeClass('is-active').removeAttr('aria-current');
			$activeLink = $();
			$nav.removeClass('is-hover');
			moveIndicator($activeLink);
			currentSubmenuKey = null;
			refreshDim();
		}
	}

	function getTplHtml(key) {
		if (!key) return '';
		const id = ('' + key).replace(/^#/, '');

		const $tpl = $('#' + id);
		if ($tpl.length) {
			let html = $tpl.data('html');
			if (!html) {
				html = $tpl.html();
				$tpl.data('html', html);
				$tpl.empty();
			}
			return html;
		}

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

	let swapping = false;
	let currentSubmenuKey = null;

	function swapSubmenuContentHtml(nextHtml, keyForState) {
		if (!nextHtml) return;
		if (swapping) return;
		if (currentSubmenuKey && keyForState && currentSubmenuKey === keyForState && $submenuHost.hasClass('active')) return;

		swapping = true;

		const $current = $stage.children('.submenu-panel');
		const $next = $('<div class="submenu-panel" />').html(nextHtml).appendTo($stage);

		if ($current.length) $current.addClass('abs').css({ opacity: 1 });
		$next.addClass('abs').css({ opacity: 0 });

		const opening = !$submenuHost.hasClass('active');
		const nextH = $next.outerHeight();

		if (opening) {
			$hostInner.height(nextH);
			$submenuHost.addClass('active');
		} else {
			const curH = $hostInner.outerHeight();
			if (Math.abs(curH - nextH) > 1) $hostInner.height(nextH);
		}

		requestAnimationFrame(() => {
			$next.css({ opacity: 1 });
			if ($current.length) $current.css({ opacity: 0 });
		});

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

		setTimeout(() => {
			if ($current.length) $current.remove();
			$next.removeClass('abs').css({ opacity: '' });

			setTimeout(() => $hostInner.css('height', 'auto'), 10);
			currentSubmenuKey = keyForState || null;
			swapping = false;
		}, 240);
	}

	$(document).on('click', '.menu-link', function (e) {
		if (window.matchMedia('(max-width: 1024px)').matches) return;
		const $link = $(this);
		const href = $link.attr('href') || '';
		const key = $link.data('submenu');

		if (key) {
			e.preventDefault();

			const html = getTplHtml(key);
			if (!html) return;

			$('.menu-link.is-active').not($link).removeClass('is-active').removeAttr('aria-current');
			$link.addClass('is-active').attr('aria-current', 'page');

			swapSubmenuContentHtml(html, ('' + key).replace(/^#/, ''));

			$activeLink = $link;
			indicatorReady = true;
			moveIndicator($activeLink, { color: 'active' });

			refreshDim();
			return;
		}

		$('.menu-link.is-active').not($link).removeClass('is-active').removeAttr('aria-current');
		$link.addClass('is-active').attr('aria-current', 'page');

		$activeLink = $link;
		indicatorReady = true;
		moveIndicator($activeLink, { color: 'active' });

		if (href === '#' || href.startsWith('#')) e.preventDefault();
	});

	$(document).on('mouseenter focusin', '.menu-link', function () {
		const $link = $(this);
		moveIndicator($link, { instant: !indicatorReady, color: 'hover' });
		indicatorReady = true;
	});
	$nav.on('mouseleave', function () {
		if ($activeLink && $activeLink.length) moveIndicator($activeLink, { color: 'active' });
		else {
			$nav.removeClass('has-active is-hover');
			$indicator.css({ width: 0, transform: 'translateX(0)' });
		}
	});

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
			$submenuHost.removeClass('active');
			$hostInner.height(0);
			$stage.empty();
			$('.menu-link.is-active').removeClass('is-active').removeAttr('aria-current');
			$activeLink = $();
			$nav.removeClass('is-hover');
			moveIndicator($activeLink);
			currentSubmenuKey = null;
			refreshDim();
		}
	});

	$(document).on('keydown', function (e) {
		if (e.key === 'Escape') {
			if ($searchOverlay.hasClass('active')) toggleSearch();
			if ($cartSidebar.hasClass('active')) toggleCart();
			if ($mobileMenu.hasClass('active')) toggleMobileMenu();
		}
	});

	$searchInput.on('keypress', function (e) {
		if (e.key === 'Enter') {
			const q = $.trim($(this).val());
			if (q) console.log('Search query:', q);
		}
	});

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

	$(window).on('resize', function () {
		if ($(window).width() > 768 && $mobileMenu.hasClass('active')) toggleMobileMenu();

		// 모바일 구간 들어오면 서브메뉴 호스트 닫기
		if (window.matchMedia('(max-width: 1024px)').matches) {
			closeSubmenuHost();
		}

		moveIndicator($activeLink);
	});

	console.log('Header functionality (Tamburins-like, data-submenu, no flicker) initialized');
	refreshDim();
});
