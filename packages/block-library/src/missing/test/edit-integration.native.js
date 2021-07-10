/**
 * External dependencies
 */
import { initializeEditor } from 'test/helpers';

/**
 * WordPress dependencies
 */
import { getBlockTypes, unregisterBlockType } from '@wordpress/blocks';
import * as i18n from '@wordpress/i18n';
jest.mock( '@wordpress/i18n', () => {
	const actual = jest.requireActual( '@wordpress/i18n' );
	return {
		...actual,
		_x: jest.fn( actual._x ),
	};
} );

/**
 * Internal dependencies
 */
import { registerCoreBlocks } from '../..';

beforeAll( () => {
	// Register all core blocks
	registerCoreBlocks();
} );

afterAll( () => {
	// Clean up registered blocks
	getBlockTypes().forEach( ( block ) => {
		unregisterBlockType( block.name );
	} );
} );

describe( 'Unsupported block', () => {
	it( 'requests translated block title', async () => {
		const initialHtml = `<!-- wp:table -->
		 <figure class="wp-block-table"><table><tbody><tr><td>1</td><td>2</td></tr><tr><td>3</td><td>4</td></tr></tbody></table></figure>
		 <!-- /wp:table -->`;
		await initializeEditor( {
			initialHtml,
		} );

		// jest spy for the _x translation function
		const _xSpy = jest.spyOn( i18n, '_x' );

		expect( _xSpy ).toHaveBeenCalled();
	} );
} );
