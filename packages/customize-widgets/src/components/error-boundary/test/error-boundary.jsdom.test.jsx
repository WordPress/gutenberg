import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { speak } from '@wordpress/a11y';
import * as wpHooks from '@wordpress/hooks';
import ErrorBoundary from '../index';

vi.mock( import( '@wordpress/a11y' ), () => ( { speak: vi.fn() } ) );

const theError = new Error( 'Kaboom' );

const ChildComponent = () => {
	throw theError;
};

describe( 'Error Boundary', () => {
	describe( 'when error is thrown from a Child component', () => {
		it( 'announces the error title and description without action labels', () => {
			render(
				<ErrorBoundary>
					<ChildComponent />
				</ErrorBoundary>
			);

			expect( console ).toHaveErrored();
			expect( speak ).toHaveBeenCalledExactlyOnceWith(
				'The editor has crashed. An unknown error occurred. Reload your browser to try again, or copy the error to report the problem or search.',
				'assertive'
			);
			expect( screen.queryByRole( 'alert' ) ).not.toBeInTheDocument();
			const copyError = screen.getByRole( 'button', {
				name: 'Copy error',
			} );
			expect( copyError ).toBeVisible();
		} );

		it( 'calls the `editor.ErrorBoundary.errorLogged` hook action with the error object and error info', () => {
			const doAction = vi.spyOn( wpHooks, 'doAction' );

			render(
				<ErrorBoundary>
					<ChildComponent />
				</ErrorBoundary>
			);

			expect( doAction ).toHaveBeenCalledWith(
				'editor.ErrorBoundary.errorLogged',
				theError,
				expect.objectContaining( {
					componentStack: expect.any( String ),
				} )
			);
			expect( console ).toHaveErrored();
		} );
	} );
} );
