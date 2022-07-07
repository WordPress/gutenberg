const REUSABLE_BLOCKS_CATEGORY = 'reusable';
const ALLOWED_EMBED_VARIATIONS = [
	'core/embed',
	'core/embed/youtube',
	'core/embed/twitter',
	'core/embed/wordpress',
	'core/embed/instagram',
	'core/embed/vimeo',
];

export function blockAllowed( block, { onlyReusable, allowReusable } ) {
	const { id, category } = block;
	const isReusable = category === REUSABLE_BLOCKS_CATEGORY;

	if ( onlyReusable ) {
		return isReusable;
	}

	if ( isReusable ) {
		return allowReusable;
	}
	// We don't want to show all possible embed variations
	// as different blocks in the inserter. We'll only show a
	// few popular ones.
	return category !== 'embed' || ALLOWED_EMBED_VARIATIONS.includes( id );
}

export function filterInserterItems(
	items,
	{ onlyReusable = false, allowReusable = false } = {}
) {
	return items.filter( ( block ) =>
		blockAllowed( block, { onlyReusable, allowReusable } )
	);
}
