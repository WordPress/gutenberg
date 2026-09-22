import { render, screen } from '@testing-library/react';
import Label from '../label';
import { POSITIONS } from '../utils';

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
		expect( label ).toHaveAttribute( 'data-wp-component', 'Text' );
		expect( label ).toHaveStyle( { fontWeight: 'normal' } );
	} );
} );
