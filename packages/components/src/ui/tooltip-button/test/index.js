/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { TooltipButton } from '..';

describe( 'TooltipButton', () => {
	it( 'should render a button without a tooltip if provided no tooltip props', () => {
		const { container } = render(
			<TooltipButton>WordPress.org</TooltipButton>
		);
		expect( container.firstChild.tagName ).toBe( 'BUTTON' );
	} );

	it( 'should render a button with a tooltip', () => {
		render(
			<TooltipButton
				tooltip={ { content: 'Code is Poetry', visible: true } }
			>
				WordPress.org
			</TooltipButton>
		);
		const button = screen.queryByText( 'WordPress.org' );
		expect( button ).not.toBeNull();
		const tooltipContent = screen.queryByText( 'Code is Poetry' );
		expect( tooltipContent ).not.toBeNull();
	} );
} );
