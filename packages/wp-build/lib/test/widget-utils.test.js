/**
 * External dependencies
 */
import { readdirSync } from 'fs';

/**
 * Internal dependencies
 */
import { getAllWidgets, getWidgetFiles } from '../widget-utils.mjs';

jest.mock( 'fs', () => ( {
	readdirSync: jest.fn(),
} ) );

describe( 'widget-utils', () => {
	afterEach( () => {
		jest.resetAllMocks();
	} );

	describe( 'getAllWidgets', () => {
		it( 'should return widget directory names', () => {
			readdirSync.mockReturnValue( [
				{ name: 'my-widget', isDirectory: () => true },
				{ name: 'another-widget', isDirectory: () => true },
			] );

			const result = getAllWidgets( '/project' );

			expect( readdirSync ).toHaveBeenCalledWith(
				expect.stringContaining( 'dashboard-widgets' ),
				{ withFileTypes: true }
			);
			expect( result ).toEqual( [ 'my-widget', 'another-widget' ] );
		} );

		it( 'should return empty array when dashboard-widgets directory does not exist', () => {
			const error = new Error( 'ENOENT' );
			error.code = 'ENOENT';
			readdirSync.mockImplementation( () => {
				throw error;
			} );

			const result = getAllWidgets( '/project' );

			expect( result ).toEqual( [] );
		} );

		it( 'should filter out non-directory entries', () => {
			readdirSync.mockReturnValue( [
				{ name: 'my-widget', isDirectory: () => true },
				{ name: 'README.md', isDirectory: () => false },
				{ name: '.gitkeep', isDirectory: () => false },
			] );

			const result = getAllWidgets( '/project' );

			expect( result ).toEqual( [ 'my-widget' ] );
		} );
	} );

	describe( 'getWidgetFiles', () => {
		it( 'should detect render and widget files', () => {
			readdirSync.mockReturnValue( [
				'render.tsx',
				'widget.ts',
				'style.scss',
			] );

			const result = getWidgetFiles( '/widgets/my-widget' );

			expect( result ).toEqual( {
				hasRender: true,
				hasWidget: true,
			} );
		} );

		it.each( [
			[ 'jsx', 'js' ],
			[ 'js', 'jsx' ],
			[ 'ts', 'tsx' ],
			[ 'tsx', 'ts' ],
		] )(
			'should work with render.%s and widget.%s',
			( renderExt, widgetExt ) => {
				readdirSync.mockReturnValue( [
					`render.${ renderExt }`,
					`widget.${ widgetExt }`,
				] );

				const result = getWidgetFiles( '/widgets/test' );

				expect( result ).toEqual( {
					hasRender: true,
					hasWidget: true,
				} );
			}
		);

		it( 'should return false flags when no matching files exist', () => {
			readdirSync.mockReturnValue( [ 'style.scss', 'index.js' ] );

			const result = getWidgetFiles( '/widgets/my-widget' );

			expect( result ).toEqual( {
				hasRender: false,
				hasWidget: false,
			} );
		} );

		it( 'should handle only render file existing', () => {
			readdirSync.mockReturnValue( [ 'render.tsx' ] );

			const result = getWidgetFiles( '/widgets/my-widget' );

			expect( result ).toEqual( {
				hasRender: true,
				hasWidget: false,
			} );
		} );

		it( 'should handle only widget file existing', () => {
			readdirSync.mockReturnValue( [ 'widget.js' ] );

			const result = getWidgetFiles( '/widgets/my-widget' );

			expect( result ).toEqual( {
				hasRender: false,
				hasWidget: true,
			} );
		} );
	} );
} );
