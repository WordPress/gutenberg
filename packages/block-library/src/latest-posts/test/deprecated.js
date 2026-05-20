/**
 * WordPress dependencies
 */
import {
	getBlockType,
	parse,
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import deprecated from '../deprecated';
import metadata from '../block.json';

describe( 'Latest Posts deprecations', () => {
	beforeAll( () => {
		if ( getBlockType( metadata.name ) ) {
			unregisterBlockType( metadata.name );
		}
		registerBlockType( metadata, {
			deprecated,
			save: () => null,
		} );
	} );

	afterAll( () => {
		unregisterBlockType( metadata.name );
	} );

	it( 'migrates legacy grid layout attributes to layout support attributes', () => {
		const migratedAttributes = deprecated[ 0 ].migrate( {
			postLayout: 'grid',
			columns: 4,
			postsToShow: 3,
		} );

		expect( migratedAttributes ).toEqual( {
			layout: {
				type: 'grid',
				columnCount: 4,
			},
			postsToShow: 3,
		} );
	} );

	it( 'migrates legacy grid layout attributes using the legacy columns default', () => {
		const migratedAttributes = deprecated[ 0 ].migrate( {
			postLayout: 'grid',
			columns: deprecated[ 0 ].attributes.columns.default,
			postsToShow: 3,
		} );

		expect( migratedAttributes ).toEqual( {
			layout: {
				type: 'grid',
				columnCount: 3,
			},
			postsToShow: 3,
		} );
	} );

	it( 'parses legacy grid layout attributes to layout support attributes when columns are omitted', () => {
		const [ parsedBlock ] = parse(
			'<!-- wp:latest-posts {"postLayout":"grid","postsToShow":3} /-->'
		);

		expect( parsedBlock.attributes ).toEqual(
			expect.objectContaining( {
				layout: {
					type: 'grid',
					columnCount: 3,
				},
				postsToShow: 3,
			} )
		);
		expect( parsedBlock.attributes.postLayout ).toBeUndefined();
		expect( parsedBlock.attributes.columns ).toBeUndefined();
	} );

	it( 'preserves the legacy categories migration while migrating layout', () => {
		const migratedAttributes = deprecated[ 0 ].migrate( {
			categories: '7',
			postLayout: 'grid',
			columns: 2,
		} );

		expect( migratedAttributes ).toEqual( {
			categories: [ { id: 7 } ],
			layout: {
				type: 'grid',
				columnCount: 2,
			},
		} );
	} );
} );
