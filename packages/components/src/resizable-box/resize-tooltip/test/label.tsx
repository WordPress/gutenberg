import { render, screen } from '@testing-library/react';
import Label from '../label';
import { POSITIONS } from '../utils';
import styles from '../style.module.scss';

describe( 'ResizeTooltip label', () => {
	it( 'keeps the Text contract when an ancestor uses a bold font weight', () => {
		render(
			<div style={ { fontWeight: 700 } }>
				<Label
					label="120 x 80"
					position={ POSITIONS.bottom }
					zIndex={ 1 }
				/>
			</div>
		);

		const label = screen.getByText( '120 x 80' );

		expect( label.tagName ).toBe( 'SPAN' );
		expect( label ).toHaveClass( 'components-text' );
		expect( label ).toHaveClass( 'components-truncate' );
		expect( label ).toHaveClass( styles[ 'label-text' ] );
		expect( label ).toHaveAttribute( 'data-wp-component', 'Text' );
		expect( label ).toHaveStyle( { fontWeight: 'normal' } );
	} );

	it( 'positions the label at the bottom', () => {
		const { container } = render(
			<Label label="200 px" position={ POSITIONS.bottom } zIndex={ 3 } />
		);

		// Disable reason: the wrapper is presentational and has no accessible name.
		// eslint-disable-next-line testing-library/no-node-access, testing-library/no-container
		const wrapper = container.querySelector(
			'.components-resizable-tooltip__tooltip-wrapper'
		);

		expect( wrapper ).toHaveStyle( {
			bottom: '-10px',
			left: '50%',
			position: 'absolute',
			zIndex: '3',
		} );
	} );

	it( 'positions the label in the corner', () => {
		const { container } = render(
			<Label
				label="200 x 100"
				position={ POSITIONS.corner }
				zIndex={ 3 }
			/>
		);

		// Disable reason: the wrapper is presentational and has no accessible name.
		// eslint-disable-next-line testing-library/no-node-access, testing-library/no-container
		const wrapper = container.querySelector(
			'.components-resizable-tooltip__tooltip-wrapper'
		);

		expect( wrapper ).toHaveStyle( {
			top: '4px',
			right: '4px',
			position: 'absolute',
		} );
	} );

	it( 'keeps label-text declarations when a consumer selector targets the same class', () => {
		const hash = styles[ 'label-text' ];
		const style = document.createElement( 'style' );
		style.textContent = `
			.${ hash } { color: rgb(255, 0, 0); font-size: 99px; }
			.${ hash }.${ hash }.${ hash } { color: rgb(1, 1, 1); font-size: 13px; }
		`;
		document.head.append( style );

		render(
			<Label label="80 px" position={ POSITIONS.bottom } zIndex={ 1 } />
		);

		const label = screen.getByText( '80 px' );
		const computed = window.getComputedStyle( label );

		expect( label ).toHaveClass( hash );
		expect( computed.color ).toBe( 'rgb(1, 1, 1)' );
		expect( computed.fontSize ).toBe( '13px' );

		style.remove();
	} );
} );
