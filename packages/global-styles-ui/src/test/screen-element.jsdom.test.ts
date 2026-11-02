import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { speak } from '@wordpress/a11y';
import { useStyle } from '../hooks';
import { useTextContrastWarning } from '../screen-element';

vi.mock( import( '../hooks' ), () => ( {
	useStyle: vi.fn(),
} ) );

vi.mock( import( '@wordpress/a11y' ), () => ( {
	speak: vi.fn(),
} ) );

const mockUseStyle = vi.mocked( useStyle );

const WARNING =
	'This color has poor contrast against the background. Consider increasing contrast.';

function mockStyles( styles: Record< string, unknown > ) {
	mockUseStyle.mockImplementation( ( path: string ) => [
		styles[ path ],
		vi.fn(),
	] );
}

describe( 'useTextContrastWarning', () => {
	beforeEach( () => {
		vi.clearAllMocks();
	} );

	it( 'warns and announces when the text color has poor contrast against the background', () => {
		mockStyles( {
			'color.text': '#777777',
			'color.background': '#888888',
		} );

		const { result } = renderHook( () => useTextContrastWarning( true ) );

		expect( result.current ).toBe( WARNING );
		expect( speak ).toHaveBeenCalledWith( WARNING );
	} );

	it( 'does not warn when contrast is sufficient', () => {
		mockStyles( {
			'color.text': '#000000',
			'color.background': '#ffffff',
		} );

		const { result } = renderHook( () => useTextContrastWarning( true ) );

		expect( result.current ).toBeUndefined();
		expect( speak ).not.toHaveBeenCalled();
	} );

	it( 'does not warn when disabled', () => {
		mockStyles( {
			'color.text': '#777777',
			'color.background': '#888888',
		} );

		const { result } = renderHook( () => useTextContrastWarning( false ) );

		expect( result.current ).toBeUndefined();
	} );

	it( 'does not warn when there is no background color', () => {
		mockStyles( { 'color.text': '#777777' } );

		const { result } = renderHook( () => useTextContrastWarning( true ) );

		expect( result.current ).toBeUndefined();
	} );

	it.each( [
		[ 'color.gradient', 'linear-gradient(#888888, #999999)' ],
		[ 'background.backgroundImage', { url: 'https://example.com/a.jpg' } ],
	] )( 'does not warn when the background has %s set', ( path, value ) => {
		mockStyles( {
			'color.text': '#777777',
			'color.background': '#888888',
			[ path ]: value,
		} );

		const { result } = renderHook( () => useTextContrastWarning( true ) );

		expect( result.current ).toBeUndefined();
	} );
} );
