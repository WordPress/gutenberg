const transformationCategories = {
	richText: [
		'core/paragraph',
		'core/heading',
		'core/list',
		'core/quote',
		'core/pullquote',
		'core/preformatted',
		'core/verse',
		'core/shortcode',
		'core/code',
	],
	media: [
		'core/image',
		'core/video',
		'core/gallery',
		'core/cover',
		'core/file',
		'core/audio',
		'core/media-text',
		'core/embed',
	],
	grouped: [ 'core/columns', 'core/group', 'core/text-columns' ],
	other: [
		'core/more',
		'core/nextpage',
		'core/separator',
		'core/spacer',
		'core/latest-posts',
		'core/buttons',
	],
};

export const transformationCategory = ( blockName ) => {
	const found = Object.entries(
		transformationCategories
	).find( ( [ , value ] ) => value.includes( blockName ) );
	if ( ! found ) {
		return [];
	}

	const group = found[ 0 ];
	return transformationCategories[ group ];
};

export default transformationCategories;
