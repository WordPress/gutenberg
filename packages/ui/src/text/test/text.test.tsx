import { render, screen } from '@testing-library/react';
import { createRef } from '@wordpress/element';
import { Text } from '../text';

describe( 'Text', () => {
	it( 'forwards ref', () => {
		const ref = createRef< HTMLSpanElement >();

		render( <Text ref={ ref }>Content</Text> );

		expect( ref.current ).toBeInstanceOf( HTMLSpanElement );
	} );

	it( 'applies typography design tokens', () => {
		render(
			<Text
				fontFamily="body"
				fontSize="md"
				fontWeight="medium"
				lineHeight="lg"
			>
				Content
			</Text>
		);

		const text = screen.getByText( 'Content' );

		expect( text ).toHaveStyle( {
			'font-family': 'var(--wpds-font-family-body)',
			'font-size': 'var(--wpds-font-size-md)',
			'font-weight': 'var(--wpds-font-weight-medium)',
			'line-height': 'var(--wpds-font-line-height-lg)',
		} );
	} );

	it( 'merges custom styles', () => {
		render(
			<Text
				fontWeight="regular"
				style={ { textDecoration: 'underline' } }
			>
				Content
			</Text>
		);

		const text = screen.getByText( 'Content' );

		expect( text ).toHaveStyle( {
			'font-weight': 'var(--wpds-font-weight-regular)',
			'text-decoration': 'underline',
		} );
	} );
} );
