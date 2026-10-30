import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import Avatar from '..';

describe( 'Avatar styles', () => {
	it( 'applies the border and derived name colors', async () => {
		await render( <Avatar data-testid="avatar" borderColor="#3858e9" /> );
		const avatar = screen.getByTestId( 'avatar' );
		const styles = getComputedStyle( avatar );

		expect( avatar ).toHaveClass( 'has-avatar-border-color' );
		expect(
			styles.getPropertyValue( '--editor-avatar-outline-color' )
		).toBe( '#3858e9' );
		expect(
			styles.getPropertyValue( '--editor-avatar-name-color' )
		).not.toBe( '' );
	} );

	it( 'merges the style prop with custom properties', async () => {
		await render(
			<Avatar
				data-testid="avatar"
				borderColor="#3858e9"
				style={ { left: '10px' } }
			/>
		);
		const styles = getComputedStyle( screen.getByTestId( 'avatar' ) );

		expect( styles.left ).toBe( '10px' );
		expect(
			styles.getPropertyValue( '--editor-avatar-outline-color' )
		).toBe( '#3858e9' );
	} );
} );
