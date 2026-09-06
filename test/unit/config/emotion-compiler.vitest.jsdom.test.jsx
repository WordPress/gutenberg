import styled from '@emotion/styled';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe( 'Emotion compiler transform', () => {
	it( 'compiles styled components with stable labels', () => {
		const Box = styled.div`
			color: red;
		`;

		render( <Box>Content</Box> );

		const box = screen.getByText( 'Content' );
		expect( box ).toBeInTheDocument();
		expect( Array.from( box.classList ) ).toEqual(
			expect.arrayContaining( [
				expect.stringMatching( /^css-[a-z0-9]+-Box$/ ),
			] )
		);
	} );
} );
