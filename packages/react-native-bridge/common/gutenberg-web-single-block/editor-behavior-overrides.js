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
			const selected = document.getSelection();
			const anchorNode = selected.anchorNode;
			const anchorOffset = selected.anchorOffset;
			const focusNode = selected.focusNode;
			const focusOffset = selected.focusOffset;
			selected.setBaseAndExtent(
				anchorNode,
				anchorOffset,
				focusNode,
				focusOffset
			);
		}
	},
	true
);