export default {
	't a l e s o f g u t e n b e r g': ( event ) => {
		if (
			! document.activeElement.classList.contains(
				'edit-post-visual-editor'
			) &&
			document.activeElement !== document.body
		) {
			return;
		}

		event.preventDefault();
		window.wp.data.dispatch( 'core/block-editor' ).insertBlock(
			window.wp.blocks.createBlock( 'core/paragraph', {
				content:
					'🐡🐢🦀🐤🦋🐘🐧🐹🦁🦄🦍🐼🐿🎃🐴🐝🐆🦕🦔🌱🍇π🍌🐉💧🥨🌌🍂🍠🥦🥚🥝🎟🥥🥒🛵🥖🍒🍯🎾🎲🐺🐚🐮⌛️',
			} )
		);
	},
};
