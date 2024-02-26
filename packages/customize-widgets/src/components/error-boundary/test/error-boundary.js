/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import * as wpHooks from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import ErrorBoundary from '../index';

const theError = new Error( 'Kaboom' );

const ChildComponent = () => {
	throw theError;
};

describe( 'Error Boundary', () => {
	describe( 'when error is thrown from a Child component', () => {
		it( 'calls the `editor.ErrorBoundary.errorLogged` hook action with the error object', () => {
			const doAction = jest.spyOn( wpHooks, 'doAction' );

			render(
				<ErrorBoundary>
					<ChildComponent />
				</ErrorBoundary>
			);

			expect( doAction ).toHaveBeenCalledWith(
				'editor.ErrorBoundary.errorLogged',
				theError
			);
			expect( console ).toHaveErrored();
		} );
	} );
} );
