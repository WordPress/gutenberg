import { describe, expect, it } from 'vitest';
// Direct Emotion usage provides a minimal compiler and browser-style fixture.
// eslint-disable-next-line no-restricted-imports
import styled from '@emotion/styled';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { PolymorphicElement } from '../polymorphic-element';

const StyledPolymorphicElement = styled( PolymorphicElement )( {
	color: 'rgb(255, 0, 0)',
} );

describe( 'PolymorphicElement styles', () => {
	it( 'applies inline styles to intrinsic elements', async () => {
		await render(
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

	it( 'applies generated and inline styles to styled elements', async () => {
		await render(
			<StyledPolymorphicElement
				data-testid="styled-element"
				style={ { backgroundColor: 'rgb(0, 0, 255)' } }
			/>
		);

		const style = getComputedStyle(
			screen.getByTestId( 'styled-element' )
		);
		expect( style.color ).toBe( 'rgb(255, 0, 0)' );
		expect( style.backgroundColor ).toBe( 'rgb(0, 0, 255)' );
	} );
} );
