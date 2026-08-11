import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import withSpokenMessages from '../';

describe( 'withSpokenMessages', () => {
	it( 'should generate speak and debouncedSpeak props', () => {
		const testSpeak = vi.fn();
		const testDebouncedSpeak = vi.fn();
		const isFunction = ( maybeFunc: any ) =>
			typeof maybeFunc === 'function';
		const DumpComponent = withSpokenMessages(
			( { speak, debouncedSpeak } ) => {
				testSpeak( isFunction( speak ) );
				testDebouncedSpeak( isFunction( debouncedSpeak ) );
				return <div />;
			}
		);
		render( <DumpComponent /> );

		// Unrendered element.
		expect( testSpeak ).toHaveBeenCalledWith( true );
		expect( testDebouncedSpeak ).toHaveBeenCalledWith( true );
	} );
} );
