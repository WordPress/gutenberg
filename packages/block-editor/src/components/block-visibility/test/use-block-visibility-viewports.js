/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { useBlockVisibilityViewports } from '../use-block-visibility-viewports';
import { BLOCK_VISIBILITY_VIEWPORTS } from '../constants';

jest.mock( '../../use-settings', () => ( {
	useSettings: jest.fn(),
} ) );

import { useSettings } from '../../use-settings';

describe( 'useBlockVisibilityViewports', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'returns the default viewports when no theme viewports are defined', () => {
		useSettings.mockReturnValue( [ undefined ] );

		const { result } = renderHook( () => useBlockVisibilityViewports() );

		expect( result.current ).toBe( BLOCK_VISIBILITY_VIEWPORTS );
	} );

	it( 'returns the default viewports when theme viewports is an empty array', () => {
		useSettings.mockReturnValue( [ [] ] );

		const { result } = renderHook( () => useBlockVisibilityViewports() );

		expect( result.current ).toBe( BLOCK_VISIBILITY_VIEWPORTS );
	} );

	it( 'merges a mobile size override into the defaults', () => {
		useSettings.mockReturnValue( [
			[ { slug: 'mobile', size: '600px' } ],
		] );

		const { result } = renderHook( () => useBlockVisibilityViewports() );

		expect( result.current.mobile.size ).toBe( '600px' );
		expect( result.current.tablet ).toBe(
			BLOCK_VISIBILITY_VIEWPORTS.tablet
		);
		expect( result.current.desktop ).toBe(
			BLOCK_VISIBILITY_VIEWPORTS.desktop
		);
	} );

	it( 'merges a tablet size override into the defaults', () => {
		useSettings.mockReturnValue( [
			[ { slug: 'tablet', size: '900px' } ],
		] );

		const { result } = renderHook( () => useBlockVisibilityViewports() );

		expect( result.current.tablet.size ).toBe( '900px' );
		expect( result.current.mobile ).toBe(
			BLOCK_VISIBILITY_VIEWPORTS.mobile
		);
	} );

	it( 'merges both mobile and tablet size overrides', () => {
		useSettings.mockReturnValue( [
			[
				{ slug: 'mobile', size: '600px' },
				{ slug: 'tablet', size: '900px' },
			],
		] );

		const { result } = renderHook( () => useBlockVisibilityViewports() );

		expect( result.current.mobile.size ).toBe( '600px' );
		expect( result.current.tablet.size ).toBe( '900px' );
	} );

	it( 'preserves label and icon from defaults when overriding size', () => {
		useSettings.mockReturnValue( [
			[ { slug: 'mobile', size: '600px' } ],
		] );

		const { result } = renderHook( () => useBlockVisibilityViewports() );

		expect( result.current.mobile.label ).toBe(
			BLOCK_VISIBILITY_VIEWPORTS.mobile.label
		);
		expect( result.current.mobile.icon ).toBe(
			BLOCK_VISIBILITY_VIEWPORTS.mobile.icon
		);
	} );

	it( 'ignores unknown slugs in theme viewports', () => {
		useSettings.mockReturnValue( [
			[ { slug: 'desktop', size: '1200px' } ],
		] );

		const { result } = renderHook( () => useBlockVisibilityViewports() );

		// desktop has no size in defaults and the hook should not add one
		expect( result.current.desktop.size ).toBeUndefined();
	} );
} );
