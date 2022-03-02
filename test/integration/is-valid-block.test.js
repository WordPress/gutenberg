/**
 * WordPress dependencies
 */
import { isValidBlockContent } from '@wordpress/blocks';
import { createElement } from '@wordpress/element';

describe( 'isValidBlockContent', () => {
	beforeAll( () => {
		// Load all hooks that modify blocks.
		require( '../../packages/editor/src/hooks' );
	} );

	it( 'should use the namespace in the classname for non-core blocks', () => {
		const valid = isValidBlockContent(
			{
				save: ( { attributes } ) =>
					createElement( 'div', null, attributes.fruit ),
				name: 'myplugin/fruit',
			},
			{ fruit: 'Bananas' },
			'<div class="wp-block-myplugin-fruit">Bananas</div>'
		);

		expect( valid ).toBe( true );
	} );

	it( 'should include additional classes in block attributes', () => {
		const valid = isValidBlockContent(
			{
				save: ( { attributes } ) =>
					createElement(
						'div',
						{
							className: 'fruit',
						},
						attributes.fruit
					),
				name: 'myplugin/fruit',
			},
			{
				fruit: 'Bananas',
				className: 'fresh',
			},
			'<div class="wp-block-myplugin-fruit fruit fresh">Bananas</div>'
		);

		expect( valid ).toBe( true );
	} );

	it( 'should not add a className if falsy', () => {
		const valid = isValidBlockContent(
			{
				save: ( { attributes } ) =>
					createElement( 'div', null, attributes.fruit ),
				name: 'myplugin/fruit',
				supports: {
					className: false,
				},
			},
			{ fruit: 'Bananas' },
			'<div>Bananas</div>'
		);

		expect( valid ).toBe( true );
	} );
} );
