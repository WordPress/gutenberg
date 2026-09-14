import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../index';

vi.mock( import( '../../../store' ), () => ( { store: {} } ) );

function CrashingChild() {
	throw new Error( 'Kaboom' );
}

describe( 'Error Boundary', () => {
	it( 'keeps both recovery actions outside the error alert', () => {
		render(
			<ErrorBoundary canCopyContent>
				<CrashingChild />
			</ErrorBoundary>
		);

		expect( console ).toHaveErrored();
		const alert = screen.getByRole( 'alert' );
		expect( alert ).toHaveTextContent(
			/^An unknown error occurred\. Reload your browser to try again, or copy the error to report the problem or search\.$/
		);
		const copyContents = screen.getByRole( 'button', {
			name: 'Copy contents',
		} );
		const copyError = screen.getByRole( 'button', { name: 'Copy error' } );
		expect( copyContents ).toBeVisible();
		expect( copyError ).toBeVisible();
		expect( alert ).not.toContainElement( copyContents );
		expect( alert ).not.toContainElement( copyError );
	} );
} );
