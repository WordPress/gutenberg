import { describe, expect, it } from 'vitest';
// Direct Emotion usage provides a minimal compiler and browser-style fixture.
// eslint-disable-next-line no-restricted-imports
import styled from '@emotion/styled';
import { render, screen } from '@testing-library/react';
import { PolymorphicElement } from '../polymorphic-element';

const StyledDiv = styled.div( {
	color: 'rgb(255, 0, 0)',
} );

describe( 'PolymorphicElement styles', () => {
	it( 'applies inline styles to intrinsic elements', () => {
		render(
			<PolymorphicElement
				data-testid="polymorphic-element"
				style={ { color: 'rgb(255, 0, 0)' } }
			/>
		);

		expect(
			getComputedStyle( screen.getByTestId( 'polymorphic-element' ) )
				.color
		).toBe( 'rgb(255, 0, 0)' );
	} );

	it( 'applies generated Emotion styles in the browser', () => {
		render( <StyledDiv data-testid="styled-div" /> );

		expect(
			getComputedStyle( screen.getByTestId( 'styled-div' ) ).color
		).toBe( 'rgb(255, 0, 0)' );
	} );
} );
