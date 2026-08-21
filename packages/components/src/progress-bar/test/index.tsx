import { render, screen } from '@testing-library/react';
import { ProgressBar } from '..';
import styles from '../style.module.scss';

/*
 * TODO: the stylesheet is mocked in these tests, so anything the SCSS module
 * is responsible for cannot be asserted here — that the `progress` element is
 * visually hidden and only exposed for semantics, and that the indeterminate
 * indicator is 50% wide. Assert those against real styles once browser-backed
 * component tests are available.
 */
describe( 'ProgressBar', () => {
	it( 'should render an indeterminate semantic progress bar element', () => {
		render( <ProgressBar /> );

		const progressBar = screen.getByRole( 'progressbar' );

		expect( progressBar ).toBeInTheDocument();
		expect( progressBar ).not.toHaveValue();
	} );

	it( 'should render a determinate semantic progress bar element', () => {
		render( <ProgressBar value={ 55 } /> );

		const progressBar = screen.getByRole( 'progressbar' );

		expect( progressBar ).toBeInTheDocument();
		expect( progressBar ).toHaveValue( 55 );
	} );

	it( 'should mark the indicator as indeterminate when no value is provided', () => {
		const { container } = render( <ProgressBar /> );

		/**
		 * We're intentionally not using an accessible selector, because
		 * the track is an intentionally non-interactive presentation element.
		 */
		// eslint-disable-next-line testing-library/no-node-access
		const indicator = container.firstChild?.firstChild;

		expect( indicator ).toHaveClass( styles[ 'is-indeterminate' ] );
		expect( indicator ).not.toHaveStyle( {
			'--indicator-width': expect.any( String ),
		} );
	} );

	it( 'should use `value`% as width for determinate progress bar', () => {
		const { container } = render( <ProgressBar value={ 55 } /> );

		/**
		 * We're intentionally not using an accessible selector, because
		 * the track is an intentionally non-interactive presentation element.
		 */
		// eslint-disable-next-line testing-library/no-node-access
		const indicator = container.firstChild?.firstChild;

		expect( indicator ).not.toHaveClass( styles[ 'is-indeterminate' ] );
		expect( indicator ).toHaveStyle( {
			'--indicator-width': '55%',
		} );
	} );

	it( 'should pass any additional props down to the underlying `progress` element', () => {
		const id = 'foo-bar-123';
		const ariaLabel = 'in progress...';
		const style = { opacity: 1 };

		render(
			<ProgressBar id={ id } aria-label={ ariaLabel } style={ style } />
		);

		expect( screen.getByRole( 'progressbar' ) ).toHaveAttribute( 'id', id );
		expect( screen.getByRole( 'progressbar' ) ).toHaveAttribute(
			'aria-label',
			ariaLabel
		);
		expect( screen.getByRole( 'progressbar' ) ).toHaveStyle( style );
	} );
} );
