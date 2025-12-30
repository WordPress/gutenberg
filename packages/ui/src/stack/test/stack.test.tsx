import { render, screen } from '@testing-library/react';
import { createRef } from '@wordpress/element';
import { Stack } from '../stack';

jest.mock( './style.module.css', () => ( {
	stack: 'stack-class',
} ) );

describe( 'Stack', () => {
	it( 'forwards ref', () => {
		const ref = createRef< HTMLDivElement >();

		render( <Stack ref={ ref }>Content</Stack> );

		expect( ref.current ).toBeInstanceOf( HTMLDivElement );
	} );

	it( 'merges props', () => {
		render(
			<Stack
				align="center"
				className="custom-class"
				style={ { width: '10px' } }
			>
				Content
			</Stack>
		);

		const stack = screen.getByText( 'Content' );

		expect( stack ).toHaveStyle( { width: '10px', alignItems: 'center' } );
		expect( stack ).toHaveClass( 'custom-class', 'stack-class' );
	} );
} );
