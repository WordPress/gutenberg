import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as wpHooks from '@wordpress/hooks';
import ErrorBoundary from '../index';

const theError = new Error( 'Kaboom' );

const ChildComponent = () => {
	throw theError;
};

describe( 'Error Boundary', () => {
	describe( 'when error is thrown from a Child component', () => {
		it( 'announces the error message', () => {
			render(
				<ErrorBoundary>
					<ChildComponent />
				</ErrorBoundary>
			);

			expect( console ).toHaveErrored();
			expect( screen.getByRole( 'alert' ) ).toHaveTextContent(
				'An unknown error occurred.'
			);
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
