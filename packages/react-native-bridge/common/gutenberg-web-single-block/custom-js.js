window.addEventListener(
	'focus',
	function () {
		if (
			window.activeElement.classList.contains(
				'components-dropdown-menu__menu-item'
			) ||
			window.activeElement.classList.contains(
				'components-menu-item__button'
			)
		) {
		}
	},
	true
);
