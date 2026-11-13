import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { colord, extend } from 'colord';
import a11yPlugin from 'colord/plugins/a11y';
import { ThemeProvider } from '@wordpress/theme';
import '@wordpress/theme/design-tokens.css';
import DatePicker from '..';

extend( [ a11yPlugin ] );

describe( 'DatePicker', () => {
	it( 'keeps selected dates readable when the theme adjusts the primary fill', async () => {
		await render(
			<ThemeProvider
				color={ { primary: '#3858e9', background: '#1e1e1e' } }
			>
				<DatePicker currentDate="2022-05-02T11:00:00" />
			</ThemeProvider>
		);
		const selectedDate = screen.getByRole( 'button', {
			name: 'May 2, 2022. Selected',
		} );
		const computedStyles = getComputedStyle( selectedDate );
		expect(
			colord( computedStyles.color ).isReadable(
				computedStyles.backgroundColor
			)
		).toBe( true );
		await userEvent.hover( selectedDate );
		expect(
			colord( computedStyles.color ).isReadable(
				computedStyles.backgroundColor
			)
		).toBe( true );
	} );
} );
