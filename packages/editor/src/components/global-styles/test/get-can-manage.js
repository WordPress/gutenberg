/**
 * Internal dependencies
 */
import { getCanManage } from '../use-color-palette-editor';

describe( 'getCanManage', () => {
	it( 'returns false when canUser resolves to false', () => {
		expect(
			getCanManage( {
				isReady: true,
				globalStylesId: 'abc',
				canEditGlobalStyles: false,
			} )
		).toBe( false );
	} );

	it( 'returns false while canUser is still resolving (undefined)', () => {
		expect(
			getCanManage( {
				isReady: true,
				globalStylesId: 'abc',
				canEditGlobalStyles: undefined,
			} )
		).toBe( false );
	} );

	it( 'returns true when ready, id is present, and canUser is true', () => {
		expect(
			getCanManage( {
				isReady: true,
				globalStylesId: 'abc',
				canEditGlobalStyles: true,
			} )
		).toBe( true );
	} );

	it( 'returns false when global styles id is missing', () => {
		expect(
			getCanManage( {
				isReady: true,
				globalStylesId: null,
				canEditGlobalStyles: true,
			} )
		).toBe( false );
	} );

	it( 'returns false when global styles config is not ready', () => {
		expect(
			getCanManage( {
				isReady: false,
				globalStylesId: 'abc',
				canEditGlobalStyles: true,
			} )
		).toBe( false );
	} );
} );
