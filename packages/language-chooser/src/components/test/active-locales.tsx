/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

/**
 * WordPress dependencies
 */
import { speak } from '@wordpress/a11y';
// @ts-ignore
import { ShortcutProvider } from '@wordpress/keyboard-shortcuts';

/**
 * Internal dependencies
 */
import ActiveLocales from '../active-locales';
import type { Language } from '../../types';

jest.mock( 'uuid', () => ( {} ) );

jest.mock( '@wordpress/a11y', () => ( {
	speak: jest.fn(),
} ) );

/* eslint-disable camelcase */

const de_DE: Language = {
	locale: 'de_DE',
	nativeName: 'Deutsch',
	lang: 'de',
	installed: true,
};

const en_GB: Language = {
	locale: 'en_GB',
	nativeName: 'English (UK)',
	lang: 'en',
	installed: true,
};

const fr_FR: Language = {
	locale: 'fr_FR',
	nativeName: 'Français',
	lang: 'fr',
	installed: true,
};

const scrollIntoView = jest.fn();
window.HTMLElement.prototype.scrollIntoView = scrollIntoView;

function renderComponent( ui, options = {} ) {
	return render( ui, {
		wrapper: ( { children } ) => (
			// @ts-ignore
			<ShortcutProvider>{ children }</ShortcutProvider>
		),
		...options,
	} );
}

describe( 'ActiveLocales', () => {
	afterEach( () => {
		jest.resetAllMocks();
	} );

	it( 'displays fallback message if list is empty', () => {
		renderComponent(
			<ActiveLocales
				languages={ [] }
				setLanguages={ () => {} }
				setSelectedLanguage={ () => {} }
			/>
		);

		expect(
			screen.getByText( /Falling back to English/ )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: /Move up/ } )
		).toHaveAttribute( 'aria-disabled', 'true' );
		expect(
			screen.getByRole( 'button', { name: /Move down/ } )
		).toHaveAttribute( 'aria-disabled', 'true' );
		expect(
			screen.getByRole( 'button', { name: /Remove/ } )
		).toHaveAttribute( 'aria-disabled', 'true' );
	} );

	it( 'displays site default fallback message if list is empty', () => {
		renderComponent(
			<ActiveLocales
				languages={ [] }
				setLanguages={ () => {} }
				setSelectedLanguage={ () => {} }
				showOptionSiteDefault
			/>
		);

		expect(
			screen.getByText( /Falling back to Site Default/ )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: /Move up/ } )
		).toHaveAttribute( 'aria-disabled', 'true' );
		expect(
			screen.getByRole( 'button', { name: /Move down/ } )
		).toHaveAttribute( 'aria-disabled', 'true' );
		expect(
			screen.getByRole( 'button', { name: /Remove/ } )
		).toHaveAttribute( 'aria-disabled', 'true' );
	} );

	it( 'prevents moving a single item', () => {
		renderComponent(
			<ActiveLocales
				languages={ [ de_DE ] }
				setLanguages={ () => {} }
				setSelectedLanguage={ () => {} }
				selectedLanguage={ de_DE }
			/>
		);
		expect( screen.queryByText( /Falling back/ ) ).not.toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: /Move up/ } )
		).toHaveAttribute( 'aria-disabled', 'true' );
		expect(
			screen.getByRole( 'button', { name: /Move down/ } )
		).toHaveAttribute( 'aria-disabled', 'true' );
		expect(
			screen.getByRole( 'button', { name: /Remove/ } )
		).toBeEnabled();
	} );

	it( 'prevents moving first item up', () => {
		renderComponent(
			<ActiveLocales
				languages={ [ de_DE, en_GB, fr_FR ] }
				setLanguages={ () => {} }
				setSelectedLanguage={ () => {} }
				selectedLanguage={ de_DE }
			/>
		);
		expect(
			screen.getByRole( 'button', { name: /Move up/ } )
		).toHaveAttribute( 'aria-disabled', 'true' );
		expect(
			screen.getByRole( 'button', { name: /Move down/ } )
		).toBeEnabled();
	} );

	it( 'prevents moving last item down', () => {
		renderComponent(
			<ActiveLocales
				languages={ [ de_DE, en_GB, fr_FR ] }
				setLanguages={ () => {} }
				setSelectedLanguage={ () => {} }
				selectedLanguage={ fr_FR }
			/>
		);
		expect(
			screen.getByRole( 'button', { name: /Move up/ } )
		).toBeEnabled();
		expect(
			screen.getByRole( 'button', { name: /Move down/ } )
		).toHaveAttribute( 'aria-disabled', 'true' );
	} );

	it( 'selects next locale when removing one', async () => {
		const setLanguages = jest.fn();
		const setSelectedLanguage = jest.fn();
		renderComponent(
			<ActiveLocales
				languages={ [ de_DE, en_GB, fr_FR ] }
				setLanguages={ setLanguages }
				setSelectedLanguage={ setSelectedLanguage }
				selectedLanguage={ de_DE }
			/>
		);

		await userEvent.click(
			screen.getByRole( 'button', { name: /Remove/ } )
		);
		expect( setSelectedLanguage ).toHaveBeenCalledWith( en_GB );
	} );

	it( 'selects previous locale when removing one', async () => {
		const setLanguages = jest.fn();
		const setSelectedLanguage = jest.fn();
		renderComponent(
			<ActiveLocales
				languages={ [ de_DE, en_GB, fr_FR ] }
				setLanguages={ setLanguages }
				setSelectedLanguage={ setSelectedLanguage }
				selectedLanguage={ fr_FR }
			/>
		);

		await userEvent.click(
			screen.getByRole( 'button', { name: /Remove/ } )
		);
		expect( setSelectedLanguage ).toHaveBeenCalledWith( en_GB );
	} );

	it( 'changes selection when clicking on locale', async () => {
		const setLanguages = jest.fn();
		const setSelectedLanguage = jest.fn();
		renderComponent(
			<ActiveLocales
				languages={ [ de_DE, en_GB, fr_FR ] }
				setLanguages={ setLanguages }
				setSelectedLanguage={ setSelectedLanguage }
				selectedLanguage={ fr_FR }
			/>
		);

		await userEvent.click(
			screen.getByRole( 'option', { name: /Deutsch/ } )
		);
		expect( setSelectedLanguage ).toHaveBeenCalledWith( de_DE );
	} );

	it( 'clears selection when removing last locale', async () => {
		const setLanguages = jest.fn();
		const setSelectedLanguage = jest.fn();
		renderComponent(
			<ActiveLocales
				languages={ [ fr_FR ] }
				setLanguages={ setLanguages }
				setSelectedLanguage={ setSelectedLanguage }
				selectedLanguage={ fr_FR }
			/>
		);

		await userEvent.click(
			screen.getByRole( 'button', { name: /Remove/ } )
		);
		expect( setSelectedLanguage ).toHaveBeenCalledWith( undefined );
	} );

	it( 'announces locale removal', async () => {
		const setLanguages = jest.fn();
		const setSelectedLanguage = jest.fn();
		renderComponent(
			<ActiveLocales
				languages={ [ de_DE, en_GB, fr_FR ] }
				setLanguages={ setLanguages }
				setSelectedLanguage={ setSelectedLanguage }
				selectedLanguage={ en_GB }
			/>
		);

		await userEvent.click(
			screen.getByRole( 'button', { name: /Remove/ } )
		);

		expect( speak ).toHaveBeenCalledWith( 'Locale removed from list' );
	} );

	it( 'announces fallback message if list is empty', async () => {
		const setLanguages = jest.fn();
		const setSelectedLanguage = jest.fn();
		renderComponent(
			<ActiveLocales
				languages={ [ en_GB ] }
				setLanguages={ setLanguages }
				setSelectedLanguage={ setSelectedLanguage }
				selectedLanguage={ en_GB }
			/>
		);

		await userEvent.click(
			screen.getByRole( 'button', { name: /Remove/ } )
		);

		expect( speak ).toHaveBeenCalledWith( 'Locale removed from list' );
		expect( speak ).toHaveBeenCalledWith(
			expect.stringMatching( /Falling back to English/ )
		);
	} );

	it( 'announces site default fallback message if list is empty', async () => {
		const setLanguages = jest.fn();
		const setSelectedLanguage = jest.fn();
		renderComponent(
			<ActiveLocales
				languages={ [ en_GB ] }
				setLanguages={ setLanguages }
				setSelectedLanguage={ setSelectedLanguage }
				selectedLanguage={ en_GB }
				showOptionSiteDefault
			/>
		);

		await userEvent.click(
			screen.getByRole( 'button', { name: /Remove/ } )
		);

		expect( speak ).toHaveBeenCalledWith( 'Locale removed from list' );
		expect( speak ).toHaveBeenCalledWith(
			expect.stringMatching( /Falling back to Site Default/ )
		);
	} );

	it( 'scrolls to newly selected locale', () => {
		const { rerender } = renderComponent(
			<ActiveLocales
				languages={ [ de_DE, en_GB, fr_FR ] }
				setLanguages={ () => {} }
				setSelectedLanguage={ () => {} }
				selectedLanguage={ de_DE }
			/>
		);

		rerender(
			<ActiveLocales
				languages={ [ de_DE, en_GB, fr_FR ] }
				setLanguages={ () => {} }
				setSelectedLanguage={ () => {} }
				selectedLanguage={ fr_FR }
			/>
		);

		expect( scrollIntoView ).toHaveBeenCalled();
	} );

	it( 'announces locale moving up', async () => {
		const setLanguages = jest.fn();
		const setSelectedLanguage = jest.fn();
		renderComponent(
			<ActiveLocales
				languages={ [ de_DE, en_GB, fr_FR ] }
				setLanguages={ setLanguages }
				setSelectedLanguage={ setSelectedLanguage }
				selectedLanguage={ en_GB }
				showOptionSiteDefault
			/>
		);

		await userEvent.click(
			screen.getByRole( 'button', { name: /Move up/ } )
		);

		expect( speak ).toHaveBeenCalledWith( 'Locale moved up' );
	} );

	it( 'announces locale moving down', async () => {
		const setLanguages = jest.fn();
		const setSelectedLanguage = jest.fn();
		renderComponent(
			<ActiveLocales
				languages={ [ de_DE, en_GB, fr_FR ] }
				setLanguages={ setLanguages }
				setSelectedLanguage={ setSelectedLanguage }
				selectedLanguage={ en_GB }
				showOptionSiteDefault
			/>
		);

		await userEvent.click(
			screen.getByRole( 'button', { name: /Move down/ } )
		);

		expect( speak ).toHaveBeenCalledWith( 'Locale moved down' );
	} );
} );

/* eslint-enable camelcase */
