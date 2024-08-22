/**
 * External dependencies
 */
import { render, screen, fireEvent } from '@testing-library/react';
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
import InactiveLocales from '../inactive-locales';
import type { Language } from '.././types';

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

const es_ES: Language = {
	locale: 'es_ES',
	nativeName: 'Español',
	lang: 'es',
	installed: false,
};

function renderComponent( ui, options = {} ) {
	return render( ui, {
		wrapper: ( { children } ) => (
			// @ts-ignore
			<ShortcutProvider>{ children }</ShortcutProvider>
		),
		...options,
	} );
}

describe( 'InactiveLocales', () => {
	afterEach( () => {
		jest.resetAllMocks();
	} );

	it( 'prevents selection if list is empty', () => {
		renderComponent(
			<InactiveLocales languages={ [] } onAddLanguage={ () => {} } />
		);
		expect( screen.getByRole( 'button', { name: /Add/ } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
		expect( screen.getByRole( 'combobox' ) ).toBeDisabled();
	} );

	it( 'adds selected locale and updates dropdown', async () => {
		const onAddLanguage = jest.fn();
		const { rerender } = renderComponent(
			<InactiveLocales
				languages={ [ de_DE, en_GB, fr_FR, es_ES ] }
				onAddLanguage={ onAddLanguage }
			/>
		);

		const add = screen.getByRole( 'button', { name: /Add/ } );
		const dropdown = screen.getByRole( 'combobox' );

		expect( add ).toBeEnabled();
		expect( dropdown ).toBeEnabled();
		expect( dropdown ).toHaveValue( 'de_DE' );

		fireEvent.change( dropdown, { target: { value: 'en_GB' } } );

		await userEvent.click( add );

		expect( onAddLanguage ).toHaveBeenCalledWith( en_GB );
		expect( dropdown ).toHaveValue( 'fr_FR' );
		expect( speak ).toHaveBeenCalledWith( 'Locale added to list' );

		rerender(
			<InactiveLocales
				languages={ [ de_DE, fr_FR, es_ES ] }
				onAddLanguage={ onAddLanguage }
			/>
		);

		await userEvent.click( add );

		expect( onAddLanguage ).toHaveBeenCalledWith( fr_FR );
		expect( dropdown ).toHaveValue( 'de_DE' );
		expect( speak ).toHaveBeenCalledWith( 'Locale added to list' );

		rerender(
			<InactiveLocales
				languages={ [ de_DE, es_ES ] }
				onAddLanguage={ onAddLanguage }
			/>
		);

		await userEvent.click( add );

		expect( onAddLanguage ).toHaveBeenCalledWith( de_DE );
		expect( dropdown ).toHaveValue( 'es_ES' );
		expect( speak ).toHaveBeenCalledWith( 'Locale added to list' );

		rerender(
			<InactiveLocales
				languages={ [ es_ES ] }
				onAddLanguage={ onAddLanguage }
			/>
		);

		await userEvent.click( add );

		expect( onAddLanguage ).toHaveBeenCalledWith( es_ES );
		expect( speak ).toHaveBeenCalledWith( 'Locale added to list' );
	} );
} );

/* eslint-enable camelcase */
