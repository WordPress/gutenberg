import { render, screen } from '@testing-library/react';
import { createElement, createRef } from '@wordpress/element';
import ResizeTooltip from '../index';
import styles from '../style.module.scss';

describe( 'ResizeTooltip', () => {
	it( 'renders the legacy root class together with className and style', () => {
		render(
			<ResizeTooltip
				className="custom-tooltip"
				data-testid="resize-tooltip"
				style={ { zIndex: 7 } }
			/>
		);

		const root = screen.getByTestId( 'resize-tooltip' );

		expect( root ).toHaveClass( 'components-resize-tooltip' );
		expect( root ).toHaveClass( styles.root );
		expect( root ).toHaveClass( 'custom-tooltip' );
		expect( root ).toHaveStyle( { zIndex: '7' } );
	} );

	it( 'renders as a different element and forwards the root ref', () => {
		const ref = createRef< HTMLElement >();

		render(
			<ResizeTooltip
				as="section"
				data-testid="resize-tooltip"
				ref={ ref }
			/>
		);

		const root = screen.getByTestId( 'resize-tooltip' );

		expect( root.tagName ).toBe( 'SECTION' );
		expect( ref.current ).toBe( root );
	} );

	it( 'forwards target-specific props and filters invalid intrinsic props', () => {
		render(
			createElement( ResizeTooltip, {
				as: 'label',
				'data-testid': 'resize-tooltip',
				htmlFor: 'size-field',
				labelPosition: 'top',
			} as React.ComponentProps< typeof ResizeTooltip > & {
				labelPosition: string;
			} )
		);

		const root = screen.getByTestId( 'resize-tooltip' );

		expect( root ).toHaveAttribute( 'for', 'size-field' );
		expect( root ).not.toHaveAttribute( 'labelPosition' );
		expect( root ).not.toHaveAttribute( 'labelposition' );
	} );
} );
