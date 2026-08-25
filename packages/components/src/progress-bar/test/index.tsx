import { render, screen } from '@testing-library/react';
import { ProgressBar } from '..';

/*
 * TODO: the stylesheet is mocked in these tests, so nothing the SCSS module is
 * responsible for can be asserted here — that the `progress` element is visually
 * hidden and only exposed for semantics, and that the indeterminate indicator is
 * 50% wide and slides across the track. Assert those against real styles once
 * browser-backed component tests are available.
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

	it( 'should not set an inline indicator width for indeterminate progress bar', () => {
		const { container } = render( <ProgressBar /> );

		/**
		 * We're intentionally not using an accessible selector, because
		 * the track is an intentionally non-interactive presentation element.
		 */
		// eslint-disable-next-line testing-library/no-node-access
		const indicator = container.firstChild?.firstChild as HTMLElement;

		// The indeterminate width is left to the stylesheet.
		expect( indicator.style.getPropertyValue( '--indicator-width' ) ).toBe(
			''
		);
	} );

	it( 'should use `value`% as width for determinate progress bar', () => {
		const { container } = render( <ProgressBar value={ 55 } /> );

		/**
		 * We're intentionally not using an accessible selector, because
		 * the track is an intentionally non-interactive presentation element.
		 */
		// eslint-disable-next-line testing-library/no-node-access
		const indicator = container.firstChild?.firstChild;

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
