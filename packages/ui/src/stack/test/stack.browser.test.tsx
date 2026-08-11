import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createRef } from '@wordpress/element';
import { Stack } from '../stack';
import styles from '../style.module.css';

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

		const computedStyle = getComputedStyle( stack );
		expect( computedStyle.display ).toBe( 'flex' );
		expect( computedStyle.width ).toBe( '10px' );
		expect( computedStyle.alignItems ).toBe( 'center' );
		expect( stack ).toHaveClass( 'custom-class', styles.stack );
	} );
} );
