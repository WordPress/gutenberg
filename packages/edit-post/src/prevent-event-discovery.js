export default {
	't a l e s o f g u t e n b e r g': ( event ) => {
		const { ownerDocument } = event.target;
		if (
			! ownerDocument.activeElement.classList.contains(
				'edit-post-visual-editor'
			) &&
			ownerDocument.activeElement !== ownerDocument.body
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
