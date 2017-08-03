/**
 * Internal dependencies
 */
import { isValidBlock } from '../validation';
import {
	registerBlockType,
	unregisterBlockType,
	getBlockTypes,
	getBlockType,
	setUnknownTypeHandler,
} from '../registration';

describe( 'validation', () => {
	const defaultBlockSettings = {
		save: ( { attributes } ) => attributes.fruit,
	};

	afterEach( () => {
		setUnknownTypeHandler( undefined );
		getBlockTypes().forEach( ( block ) => {
			unregisterBlockType( block.name );
		} );
	} );

	describe( 'isValidBlock()', () => {
		it( 'returns false is block is not valid', () => {
			registerBlockType( 'core/test-block', defaultBlockSettings );

			expect( isValidBlock(
				'Apples',
				getBlockType( 'core/test-block' ),
				{ fruit: 'Bananas' }
			) ).toBe( false );
		} );

		it( 'returns true is block is valid', () => {
			registerBlockType( 'core/test-block', defaultBlockSettings );

			expect( isValidBlock(
				'Bananas',
				getBlockType( 'core/test-block' ),
				{ fruit: 'Bananas' }
			) ).toBe( true );
		} );
	} );
} );
