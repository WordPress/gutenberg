/**
 * WordPress dependencies
 */
import { createElement } from '@wordpress/element';
import {
	getBlockTypes,
	registerBlockType,
	unregisterBlockType,
	validateBlock,
} from '@wordpress/blocks';
import { useBlockProps } from '@wordpress/block-editor';

describe( 'validateBlock', () => {
	beforeAll( () => {
		// Load all hooks that modify blocks.
		require( '../../packages/editor/src/hooks' );
	} );

	afterEach( () => {
		getBlockTypes().forEach( ( block ) => {
			unregisterBlockType( block.name );
		} );
	} );

	it( 'should use the namespace in the classname for non-core blocks', () => {
		registerBlockType( 'myplugin/fruit', {
			apiVersion: 3,
			save: ( { attributes } ) =>
				createElement( 'div', useBlockProps.save(), attributes.fruit ),
			name: 'myplugin/fruit',
			category: 'text',
			title: 'Fruit block',
		} );

		const [ valid ] = validateBlock( {
			name: 'myplugin/fruit',
			attributes: {
				fruit: 'Bananas',
			},
			originalContent:
				'<div class="wp-block-myplugin-fruit">Bananas</div>',
		} );

		expect( valid ).toBe( true );
	} );

	it( 'should include additional classes in block attributes', () => {
		registerBlockType( 'muplugin/fruit', {
			apiVersion: 3,
			save: ( { attributes } ) =>
				createElement(
					'div',
					useBlockProps.save( {
						className: 'fruit',
					} ),
					attributes.fruit
				),
			name: 'myplugin/fruit',
			category: 'text',
			title: 'Fruit block',
		} );

		const [ valid ] = validateBlock( {
			name: 'myplugin/fruit',
			attributes: { fruit: 'Bananas', className: 'fresh' },
			originalContent:
				'<div class="wp-block-myplugin-fruit fruit fresh">Bananas</div>',
		} );

		expect( valid ).toBe( true );
	} );

	it( 'should not add a className if falsy', () => {
		registerBlockType( 'myplugin/fruit', {
			apiVersion: 3,
			save: ( { attributes } ) =>
				createElement( 'div', useBlockProps.save(), attributes.fruit ),
			name: 'myplugin/fruit',
			category: 'text',
			title: 'Fruit block',
			supports: {
				className: false,
			},
		} );

		const [ valid ] = validateBlock( {
			name: 'myplugin/fruit',
			attributes: { fruit: 'Bananas' },
			originalContent: '<div>Bananas</div>',
		} );

		expect( valid ).toBe( true );
	} );
} );
