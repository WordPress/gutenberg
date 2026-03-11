const CATEGORIES = [ 'site', 'copy', 'images', 'additional', 'blocks' ];

/**
 * Parse response function used in Content Guidelines
 *
 * @param {Object} response The response object to parse.
 *
 * @return {Object} The parsed content guidelines state.
 */
export default function parseResponse( response ) {
	if ( ! response || typeof response !== 'object' ) {
		return {};
	}

	const categoriesFromResponse = response.guideline_categories ?? {};

	const result = {
		id: response.id ?? null,
		status: response.status ?? null,
		categories: {
			site: '',
			copy: '',
			images: '',
			additional: '',
			blocks: {},
		},
	};

	CATEGORIES.forEach( ( category ) => {
		const guidelines = categoriesFromResponse?.[ category ]?.guidelines;
		if ( typeof guidelines === 'string' ) {
			result.categories[ category ] = guidelines;
		} else if ( category === 'blocks' ) {
			const blocks = categoriesFromResponse?.blocks ?? {};
			for ( const [ blockName, blockData ] of Object.entries( blocks ) ) {
				result.categories.blocks[ blockName ] = blockData?.guidelines;
			}
		}
	} );

	return result;
}
