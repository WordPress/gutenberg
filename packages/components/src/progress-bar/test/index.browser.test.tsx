import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { ProgressBar } from '..';

describe( 'ProgressBar', () => {
	it( 'should render an indeterminate semantic progress bar element', async () => {
		await render( <ProgressBar /> );

		const progressBar = screen.getByRole( 'progressbar' );

		expect( progressBar ).toBeInTheDocument();
		expect( progressBar ).not.toHaveValue();
	} );

	it( 'should render a determinate semantic progress bar element', async () => {
		await render( <ProgressBar value={ 55 } /> );

		const progressBar = screen.getByRole( 'progressbar' );

		expect( progressBar ).toBeInTheDocument();
		expect( progressBar ).toHaveValue( 55 );
	} );

	it( 'should use the stylesheet-defined width for an indeterminate progress bar', async () => {
		const { container } = await render( <ProgressBar /> );

		/**
		 * We're intentionally not using an accessible selector, because
		 * the track is an intentionally non-interactive presentation element.
		 */
		// eslint-disable-next-line testing-library/no-node-access
		const indicator = container.firstChild?.firstChild as HTMLElement;
		const style = getComputedStyle( indicator as Element );
		// The track is the indicator's non-interactive presentation parent.
		const trackWidth = getComputedStyle(
			// eslint-disable-next-line testing-library/no-node-access
			( indicator as Element ).parentElement!
		).width;
		expect( Number.parseFloat( style.width ) ).toBe(
			Number.parseFloat( trackWidth ) / 2
		);
		expect( style.getPropertyValue( '--indicator-width' ) ).toBe( '50%' );
	} );

	it( 'should use `value`% as width for determinate progress bar', async () => {
		const { container } = await render( <ProgressBar value={ 55 } /> );

		/**
		 * We're intentionally not using an accessible selector, because
		 * the track is an intentionally non-interactive presentation element.
		 */
		// eslint-disable-next-line testing-library/no-node-access
		const indicator = container.firstChild?.firstChild;

		expect(
			getComputedStyle( indicator as Element ).getPropertyValue(
				'--indicator-width'
			)
		).toBe( '55%' );
	} );

	it( 'should pass any additional props down to the underlying `progress` element', async () => {
		const id = 'foo-bar-123';
		const ariaLabel = 'in progress...';
		const style = { opacity: 1 };

		await render(
			<ProgressBar id={ id } aria-label={ ariaLabel } style={ style } />
		);

		expect( screen.getByRole( 'progressbar' ) ).toHaveAttribute( 'id', id );
		expect( screen.getByRole( 'progressbar' ) ).toHaveAttribute(
			'aria-label',
			ariaLabel
		);
		expect(
			getComputedStyle( screen.getByRole( 'progressbar' ) ).opacity
		).toBe( '1' );
	} );
} );
