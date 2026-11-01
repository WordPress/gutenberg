/**
 * WordPress dependencies
 */
import {
	createBlock,
	getBlockTypes,
	registerBlockType,
	switchToBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import {
	metadata as buttonsMetadata,
	settings as buttonsSettings,
} from '../index';
import {
	metadata as buttonMetadata,
	settings as buttonSettings,
} from '../../button/index';

describe( 'transforms', () => {
	beforeAll( () => {
		registerBlockType( buttonMetadata, buttonSettings );
		registerBlockType( buttonsMetadata, buttonsSettings );
	} );

	afterAll( () => {
		getBlockTypes().forEach( ( block ) => {
			unregisterBlockType( block.name );
		} );
	} );

	describe( 'from core/button', () => {
		it( 'should move the align attribute from the button to the buttons wrapper', () => {
			const block = createBlock( 'core/button', {
				text: 'Click me',
				align: 'center',
			} );

			// Manually set align on the block attributes to simulate old markup
			// where core/button supported align before it was moved to core/buttons.
			block.attributes.align = 'center';

			const [ result ] = switchToBlockType( block, 'core/buttons' );

			expect( result.name ).toBe( 'core/buttons' );
			expect( result.attributes.align ).toBe( 'center' );
			expect( result.innerBlocks[ 0 ].attributes.align ).toBeUndefined();
		} );

		it( 'should not set align on the wrapper when the button has no align', () => {
			const block = createBlock( 'core/button', { text: 'Click me' } );

			const [ result ] = switchToBlockType( block, 'core/buttons' );

			expect( result.name ).toBe( 'core/buttons' );
			expect( result.attributes.align ).toBeUndefined();
		} );

		it( 'should move align from the first button when transforming multiple buttons', () => {
			const block1 = createBlock( 'core/button', { text: 'First' } );
			const block2 = createBlock( 'core/button', { text: 'Second' } );
			block1.attributes.align = 'wide';

			const [ result ] = switchToBlockType(
				[ block1, block2 ],
				'core/buttons'
			);

			expect( result.attributes.align ).toBe( 'wide' );
			expect( result.innerBlocks[ 0 ].attributes.align ).toBeUndefined();
			expect( result.innerBlocks[ 1 ].attributes.align ).toBeUndefined();
		} );
	} );
} );
