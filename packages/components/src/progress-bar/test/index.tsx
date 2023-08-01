/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { ProgressBar } from '..';
import { INDETERMINATE_TRACK_WIDTH } from '../styles';

describe( 'ProgressBar', () => {
	it( 'should render an indeterminate semantic progress bar element', () => {
		render( <ProgressBar /> );

		const progressBar = screen.getByRole( 'progressbar' );

		expect( progressBar ).toBeInTheDocument();
		expect( progressBar ).not.toBeVisible();
		expect( progressBar ).not.toHaveValue();
	} );

	it( 'should render a determinate semantic progress bar element', () => {
		render( <ProgressBar value={ 55 } /> );

		const progressBar = screen.getByRole( 'progressbar' );

		expect( progressBar ).toBeInTheDocument();
		expect( progressBar ).not.toBeVisible();
		expect( progressBar ).toHaveValue( 55 );
	} );

	it( 'should use `INDETERMINATE_TRACK_WIDTH`% as track width for indeterminate progress bar', () => {
		const { container } = render( <ProgressBar /> );

		/**
		 * We're intentionally not using an accessible selector, because
		 * the track is an intentionally non-interactive presentation element.
		 */
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		const indicator = container.firstChild?.firstChild;

		expect( indicator ).toHaveStyle( {
			width: `${ INDETERMINATE_TRACK_WIDTH }%`,
		} );
	} );

	it( 'should use `value`% as width for determinate progress bar', () => {
		const { container } = render( <ProgressBar value={ 55 } /> );

		/**
		 * We're intentionally not using an accessible selector, because
		 * the track is an intentionally non-interactive presentation element.
		 */
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		const indicator = container.firstChild?.firstChild;

		expect( indicator ).toHaveStyle( {
			width: '55%',
		} );
	} );

	it( 'should allow a custom `id` attribute to be specified', () => {
		const id = 'foo-bar-123';

		render( <ProgressBar id={ id } /> );

		expect( screen.getByRole( 'progressbar' ) ).toHaveAttribute( 'id', id );
	} );
} );
