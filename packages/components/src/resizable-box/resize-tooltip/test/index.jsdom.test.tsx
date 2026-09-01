import { render, screen } from '@testing-library/react';
import { createRef, createElement } from '@wordpress/element';
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

	it( 'renders as a different element, forwards the root ref, and forwards target-specific props', () => {
		const ref = createRef< HTMLElement >();

		render(
			createElement( ResizeTooltip, {
				as: 'label',
				'data-testid': 'resize-tooltip',
				htmlFor: 'size-field',
				ref,
			} as React.ComponentProps< typeof ResizeTooltip > & {
				htmlFor?: string;
			} )
		);

		const root = screen.getByTestId( 'resize-tooltip' );

		expect( root.tagName ).toBe( 'LABEL' );
		expect( ref.current ).toBe( root );
		expect( root ).toHaveAttribute( 'for', 'size-field' );
	} );
} );
