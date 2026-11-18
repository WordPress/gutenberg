import { describe, expect, it, vi, type Mock } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSettings } from '@wordpress/block-editor';
import useHasTabletViewport from '../use-has-tablet-viewport';

// The real `getViewportMediaQueries` decides which breakpoints are valid.
vi.mock( import( '@wordpress/block-editor' ), () => ( {
	useSettings: vi.fn(),
} ) );

describe( 'useHasTabletViewport', () => {
	it.each( [
		[ 'the theme sets no viewport breakpoints', undefined, true ],
		[
			'the theme sets both breakpoints',
			{ mobile: '480px', tablet: '782px' },
			true,
		],
		[
			'the tablet breakpoint is invalid',
			{ mobile: '480px', tablet: 'invalid' },
			false,
		],
		[
			'the tablet breakpoint is not above the mobile one',
			{ mobile: '800px', tablet: '782px' },
			false,
		],
	] )( 'when %s', ( _name, viewportSettings, expected ) => {
		( useSettings as Mock ).mockReturnValue( [ viewportSettings ] );

		const { result } = renderHook( () => useHasTabletViewport() );

		expect( useSettings ).toHaveBeenCalledWith( 'viewport' );
		expect( result.current ).toBe( expected );
	} );
} );
