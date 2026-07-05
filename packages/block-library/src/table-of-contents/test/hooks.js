/**
 * WordPress dependencies
 */
import { addFilter, removeFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { getLatestHeadings } from '../hooks';

function makeSelect( blocks ) {
	return ( storeNameOrDescriptor ) => {
		if ( storeNameOrDescriptor === 'core/editor' ) {
			return { getPermalink: () => null };
		}

		return {
			getBlockAttributes: ( clientId ) =>
				blocks[ clientId ]?.attributes ?? {},
			getBlockName: ( clientId ) => blocks[ clientId ]?.name,
			getBlocksByName: ( names ) =>
				Object.entries( blocks )
					.filter( ( [ , block ] ) =>
						[].concat( names ).includes( block.name )
					)
					.map( ( [ clientId ] ) => clientId ),
			getClientIdsOfDescendants: () =>
				Object.keys( blocks ).filter(
					( clientId ) => clientId !== 'toc-1'
				),
		};
	};
}

describe( 'getLatestHeadings', () => {
	afterEach( () => {
		removeFilter( 'editor.headingBlockTypes', 'test/heading-block-types' );
	} );

	const blocks = {
		'toc-1': { name: 'core/table-of-contents', attributes: {} },
		'heading-1': {
			name: 'core/heading',
			attributes: { level: 2, content: 'Core Heading' },
		},
		'custom-1': {
			name: 'my-plugin/section-heading',
			attributes: { level: 3, content: 'Custom Heading' },
		},
	};

	it( 'only includes core/heading blocks by default', () => {
		const headings = getLatestHeadings( makeSelect( blocks ), 'toc-1' );

		expect( headings ).toEqual( [
			{ content: 'Core Heading', level: 2, link: null },
		] );
	} );

	it( 'includes blocks added via the editor.headingBlockTypes filter', () => {
		addFilter(
			'editor.headingBlockTypes',
			'test/heading-block-types',
			( blockTypes ) => [ ...blockTypes, 'my-plugin/section-heading' ]
		);

		const headings = getLatestHeadings( makeSelect( blocks ), 'toc-1' );

		expect( headings ).toEqual( [
			{ content: 'Core Heading', level: 2, link: null },
			{ content: 'Custom Heading', level: 3, link: null },
		] );
	} );
} );
