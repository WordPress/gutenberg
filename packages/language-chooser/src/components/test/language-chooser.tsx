/**
 * External dependencies
 */
import {
	fireEvent,
	render,
	screen,
	waitFor,
	queryByRole,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { BACKSPACE, DOWN, END, HOME, UP } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import type { Language } from '../../types';
import LanguageChooser from '../language-chooser';

jest.mock( 'uuid', () => ( {} ) );

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

const it_IT: Language = {
	locale: 'it_IT',
	nativeName: 'Italiano',
	lang: 'it',
	installed: false,
};

const scrollIntoView = jest.fn();
window.HTMLElement.prototype.scrollIntoView = scrollIntoView;

/**
 * Workaround to trigger keyboard events.
 *
 * @see https://github.com/WordPress/gutenberg/issues/45777
 */

function moveUp() {
	fireEvent.keyDown( screen.getByRole( 'listbox' ), {
		key: 'ArrowUp',
		keyCode: UP,
	} );
}

function moveDown() {
	fireEvent.keyDown( screen.getByRole( 'listbox' ), {
		key: 'ArrowDown',
		keyCode: DOWN,
	} );
}

function selectFirst() {
	fireEvent.keyDown( screen.getByRole( 'listbox' ), {
		key: 'Home',
		keyCode: HOME,
	} );
}

function selectLast() {
	fireEvent.keyDown( screen.getByRole( 'listbox' ), {
		key: 'End',
		keyCode: END,
	} );
}

function removeLocale() {
	fireEvent.keyDown( screen.getByRole( 'listbox' ), {
		key: 'Backspace',
		keyCode: BACKSPACE,
	} );
}

function addLocale() {
	fireEvent.keyDown( screen.getByRole( 'listbox' ), {
		key: 'A',
		keyCode: 65,
		altKey: true,
	} );
}

describe( 'LanguageChooser', () => {
	it( 'shows missing translations notice', () => {
		render(
			<LanguageChooser
				allLanguages={ [] }
				preferredLanguages={ [] }
				hasMissingTranslations
			/>
		);

		// Found multiple times due to aria-live.
		expect(
			screen.getAllByText( /Some of the languages are not installed/ )
		).not.toHaveLength( 0 );
	} );

	it( 'populates hidden form field', () => {
		render(
			<LanguageChooser
				allLanguages={ [ de_DE, en_GB, fr_FR, es_ES ] }
				preferredLanguages={ [ de_DE, en_GB, fr_FR ] }
			/>
		);

		// eslint-disable-next-line testing-library/no-node-access
		const hiddenInput = document.querySelector(
			'input[name="preferred_languages"][type="hidden"]'
		);

		expect( hiddenInput ).toHaveValue( 'de_DE,en_GB,fr_FR' );
	} );

	it( 'adds language to list', async () => {
		render(
			<LanguageChooser
				allLanguages={ [ de_DE, en_GB, fr_FR, es_ES ] }
				preferredLanguages={ [ de_DE, fr_FR ] }
			/>
		);

		const dropdown = screen.getByRole( 'combobox' );
		expect( dropdown ).toBeEnabled();
		expect( dropdown ).toHaveValue( 'en_GB' );

		const add = screen.getByRole( 'button', { name: /Add/ } );
		await userEvent.click( add );

		await waitFor( () => {
			expect(
				screen.getByRole( 'option', { name: /English \(UK\)/ } )
			).toHaveAttribute( 'aria-selected', 'true' );
		} );
	} );

	it( 're-populates selected locale when empty dropdown is filled again', async () => {
		render(
			<LanguageChooser
				allLanguages={ [ de_DE, fr_FR, es_ES ] }
				preferredLanguages={ [ de_DE, fr_FR ] }
			/>
		);

		const add = screen.getByRole( 'button', { name: /Add/ } );
		const remove = screen.getByRole( 'button', { name: /Remove/ } );
		const dropdown = screen.getByRole( 'combobox' );

		expect( add ).toBeEnabled();
		expect( dropdown ).toBeEnabled();
		expect( dropdown ).toHaveValue( 'es_ES' );

		await userEvent.click( add );

		await waitFor( () => {
			expect(
				screen.getByRole( 'option', { name: /Español/ } )
			).toHaveAttribute( 'aria-selected', 'true' );
		} );

		expect( dropdown ).not.toHaveValue();
		expect( dropdown ).toBeDisabled();
		expect( screen.getByRole( 'button', { name: /Add/ } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);

		await userEvent.click( remove );

		await waitFor( () => {
			expect( dropdown ).toHaveValue( 'es_ES' );
		} );
		expect( dropdown ).toBeEnabled();
		expect( screen.getByRole( 'button', { name: /Add/ } ) ).toBeEnabled();
	} );

	it( 'supports keyboard shortcuts', async () => {
		render(
			<LanguageChooser
				allLanguages={ [ de_DE, en_GB, fr_FR, es_ES, it_IT ] }
				preferredLanguages={ [ de_DE, fr_FR, it_IT ] }
			/>
		);

		const listbox = screen.getByRole( 'listbox' );
		const dropdown = screen.getByRole( 'combobox' );

		expect(
			screen.getByRole( 'option', { name: /Deutsch/ } )
		).toHaveAttribute( 'aria-selected', 'true' );

		expect(
			screen.getByRole( 'button', { name: /Move up/ } )
		).toHaveAttribute( 'aria-disabled', 'true' );
		expect(
			screen.getByRole( 'button', { name: /Move down/ } )
		).toBeEnabled();

		listbox.focus();

		moveDown();
		moveDown();
		moveDown();

		expect(
			screen.getByRole( 'button', { name: /Move up/ } )
		).toBeEnabled();
		expect(
			screen.getByRole( 'button', { name: /Move down/ } )
		).toHaveAttribute( 'aria-disabled', 'true' );

		selectFirst();

		expect(
			screen.getByRole( 'option', { name: /Français/ } )
		).toHaveAttribute( 'aria-selected', 'true' );

		selectFirst();

		expect(
			screen.getByRole( 'option', { name: /Français/ } )
		).toHaveAttribute( 'aria-selected', 'true' );

		expect(
			screen.getByRole( 'button', { name: /Move up/ } )
		).toHaveAttribute( 'aria-disabled', 'true' );

		selectLast();

		expect(
			screen.getByRole( 'option', { name: /Deutsch/ } )
		).toHaveAttribute( 'aria-selected', 'true' );

		selectLast();

		expect(
			screen.getByRole( 'option', { name: /Deutsch/ } )
		).toHaveAttribute( 'aria-selected', 'true' );

		expect(
			screen.getByRole( 'button', { name: /Move down/ } )
		).toHaveAttribute( 'aria-disabled', 'true' );

		moveUp();
		moveUp();
		moveUp();

		expect(
			screen.getByRole( 'button', { name: /Move down/ } )
		).toBeEnabled();

		removeLocale();

		expect(
			// We want to explicitly check if it's within the container.
			// eslint-disable-next-line testing-library/prefer-screen-queries
			queryByRole( listbox, 'option', { name: /Deutsch/ } )
		).not.toBeInTheDocument();
		expect(
			screen.getByRole( 'option', { name: /Deutsch/ } )
		).toBeInTheDocument();

		removeLocale();
		removeLocale();

		expect(
			screen.getByRole( 'button', { name: /Remove/ } )
		).toHaveAttribute( 'aria-disabled', 'true' );

		removeLocale();

		expect(
			screen.getByRole( 'button', { name: /Remove/ } )
		).toHaveAttribute( 'aria-disabled', 'true' );

		selectFirst();

		selectLast();

		expect(
			screen.getByRole( 'button', { name: /Remove/ } )
		).toHaveAttribute( 'aria-disabled', 'true' );

		fireEvent.change( dropdown, { target: { value: 'en_GB' } } );
		expect( dropdown ).toHaveValue( 'en_GB' );

		addLocale();

		expect(
			screen.getByRole( 'option', { name: /English/ } )
		).toBeInTheDocument();

		expect( dropdown ).toHaveValue( 'fr_FR' );

		addLocale();

		expect( dropdown ).toHaveValue( 'de_DE' );

		addLocale();

		expect( dropdown ).toHaveValue( 'es_ES' );

		addLocale();

		expect( dropdown ).toHaveValue( 'it_IT' );

		addLocale();

		expect( dropdown ).toBeDisabled();

		addLocale();

		expect( dropdown ).toBeDisabled();
	} );

	it( 'adds a spinner when saving new translations', async () => {
		const { container } = render(
			<LanguageChooser
				allLanguages={ [ de_DE, es_ES, fr_FR ] }
				preferredLanguages={ [ es_ES ] }
			/>,
			{
				wrapper: ( { children } ) => (
					<form onSubmit={ ( e ) => e.preventDefault() }>
						{ children }
						{ /* eslint-disable-next-line no-restricted-syntax */ }
						<input type="submit" id="submit" value="Submit" />
					</form>
				),
			}
		);

		const submitButton = screen.getByRole( 'button', { name: 'Submit' } );
		await userEvent.click( submitButton );
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		const spinner = container.querySelector( '.language-install-spinner' );
		expect( spinner ).toBeInTheDocument();
	} );

	it( 'does not add a spinner if there is no matching submit button', async () => {
		const { container } = render(
			<LanguageChooser
				allLanguages={ [ de_DE, es_ES, fr_FR ] }
				preferredLanguages={ [ es_ES ] }
			/>,
			{
				wrapper: ( { children } ) => (
					<form onSubmit={ ( e ) => e.preventDefault() }>
						{ children }
						<input
							type="submit"
							// eslint-disable-next-line no-restricted-syntax
							id="anothersubmit"
							value="Submit"
						/>
					</form>
				),
			}
		);

		const submitButton = screen.getByRole( 'button', { name: 'Submit' } );
		await userEvent.click( submitButton );
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		const spinner = container.querySelector( '.language-install-spinner' );
		expect( spinner ).not.toBeInTheDocument();
	} );
} );

/* eslint-enable camelcase */
