import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { speak } from '@wordpress/a11y';
import { createElement } from '@wordpress/element';
import ErrorBoundary from '../index';

vi.mock( import( '@wordpress/a11y' ), () => ( { speak: vi.fn() } ) );

vi.mock( import( '../../../store' ), () => ( { store: {} } ) );

function CrashingChild() {
	throw new Error( 'Kaboom' );
}

describe( 'Error Boundary', () => {
	it( 'announces the error title and description without action labels', () => {
		render(
			createElement(
				ErrorBoundary,
				{ canCopyContent: true },
				createElement( CrashingChild )
			)
		);

		expect( console ).toHaveErrored();
		expect( speak ).toHaveBeenCalledExactlyOnceWith(
			'The editor has crashed. An unknown error occurred. Reload your browser to try again, or copy the error to report the problem or search.',
			'assertive'
		);
		expect( screen.queryByRole( 'alert' ) ).not.toBeInTheDocument();
		const copyContents = screen.getByRole( 'button', {
			name: 'Copy contents',
		} );
		const copyError = screen.getByRole( 'button', { name: 'Copy error' } );
		expect( copyContents ).toBeVisible();
		expect( copyError ).toBeVisible();
	} );
} );
