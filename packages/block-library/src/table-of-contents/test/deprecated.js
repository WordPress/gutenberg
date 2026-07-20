/**
 * WordPress dependencies
 */
// Load block support registration filters.
import '@wordpress/block-editor';
import {
	getBlockType,
	parse,
	registerBlockType,
	serialize,
	unregisterBlockType,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import deprecated from '../deprecated';
import metadata from '../block.json';

describe( 'Table of Contents deprecations', () => {
	const [ v1 ] = deprecated;

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

	it( 'migrates legacy saved headings and markup to a dynamic block', () => {
		const [ parsedBlock ] = parse(
			'<!-- wp:table-of-contents {"headings":[{"content":"Heading text","level":2,"link":"#heading-id-1"},{"content":"A sub-heading","level":3,"link":"#heading-id-2"}],"maxLevel":3,"ordered":false} -->\n' +
				'<nav class="wp-block-table-of-contents"><ul><li><a class="wp-block-table-of-contents__entry" href="#heading-id-1">Heading text</a><ul><li><a class="wp-block-table-of-contents__entry" href="#heading-id-2">A sub-heading</a></li></ul></li></ul></nav>\n' +
				'<!-- /wp:table-of-contents -->'
		);
		expect( console ).toHaveInformed();

		expect( parsedBlock.isValid ).toBe( true );
		expect( parsedBlock.attributes ).toEqual(
			expect.objectContaining( {
				maxLevel: 3,
				ordered: false,
			} )
		);
		expect( parsedBlock.attributes.headings ).toBeUndefined();

		const serializedBlock = serialize( parsedBlock );
		expect( serializedBlock ).toContain( '"maxLevel":3' );
		expect( serializedBlock ).toContain( '"ordered":false' );
		expect( serializedBlock ).not.toContain( 'headings' );
		expect( serializedBlock ).not.toContain( '<nav' );
		expect( serializedBlock ).toMatch(
			/^<!-- wp:table-of-contents \{.*\} \/-->$/
		);
	} );

	it( 'is eligible when legacy cached headings or saved markup are present', () => {
		expect( v1.isEligible( { headings: [] } ) ).toBe( true );
		expect(
			v1.isEligible( {}, [], {
				blockNode: {
					innerHTML: '<nav class="wp-block-table-of-contents"></nav>',
				},
			} )
		).toBe( true );
		expect(
			v1.isEligible( {}, [], { blockNode: { innerHTML: '' } } )
		).toBe( false );
	} );

	it( 'drops only cached heading data during migration', () => {
		expect(
			v1.migrate( {
				headings: [
					{
						content: 'Heading text',
						level: 2,
						link: '#heading-id-1',
					},
				],
				maxLevel: 3,
				ordered: false,
				onlyIncludeCurrentPage: true,
				anchor: 'contents',
				style: {
					spacing: {
						margin: {
							top: '1rem',
						},
					},
				},
			} )
		).toEqual( {
			maxLevel: 3,
			ordered: false,
			onlyIncludeCurrentPage: true,
			anchor: 'contents',
			style: {
				spacing: {
					margin: {
						top: '1rem',
					},
				},
			},
		} );
	} );
} );
