import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { PolymorphicElement } from '../polymorphic-element';
import styles from './polymorphic-element.module.scss';

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

	it( 'applies CSS Module and inline styles to intrinsic elements', async () => {
		await render(
			<PolymorphicElement
				className={ styles.red }
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
