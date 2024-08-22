/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { __, _x } from '@wordpress/i18n';
import { Notice } from '@wordpress/components';
import {
	ShortcutProvider,
	store as keyboardShortcutsStore,
	// @ts-ignore
} from '@wordpress/keyboard-shortcuts';

/**
 * Internal dependencies
 */
import ActiveLocales from './active-locales';
import InactiveLocales from './inactive-locales';
import type { Language } from './types';

function MissingTranslationsNotice() {
	return (
		<Notice status="warning" isDismissible={ false }>
			{ __(
				'Some of the languages are not installed. Re-save changes to download translations.'
			) }
		</Notice>
	);
}

interface HiddenFormFieldProps {
	preferredLanguages: Language[];
}

function HiddenFormField( { preferredLanguages }: HiddenFormFieldProps ) {
	const value = preferredLanguages
		.filter( ( language ) => Boolean( language ) )
		.map( ( { locale } ) => locale )
		.join( ',' );

	return <input type="hidden" name="preferred_languages" value={ value } />;
}

interface LanguageChooserProps {
	allLanguages: Language[];
	preferredLanguages: Language[];
	hasMissingTranslations?: boolean;
	showOptionSiteDefault?: boolean;
}

function LanguageChooser( props: LanguageChooserProps ) {
	const {
		allLanguages,
		hasMissingTranslations = false,
		showOptionSiteDefault = false,
	} = props;

	// @ts-ignore
	const { registerShortcut } = useDispatch( keyboardShortcutsStore );
	useEffect( () => {
		registerShortcut( {
			name: 'language-chooser/move-up',
			category: 'global',
			description: __( 'Move language up' ),
			keyCombination: {
				character: 'ArrowUp',
			},
		} );

		registerShortcut( {
			name: 'language-chooser/move-down',
			category: 'global',
			description: __( 'Move language down' ),
			keyCombination: {
				character: 'ArrowDown',
			},
		} );

		registerShortcut( {
			name: 'language-chooser/select-first',
			category: 'global',
			description: __( 'Select first language' ),
			keyCombination: {
				character: 'Home',
			},
		} );

		registerShortcut( {
			name: 'language-chooser/select-last',
			category: 'global',
			description: __( 'Select last language' ),
			keyCombination: {
				character: 'End',
			},
		} );

		registerShortcut( {
			name: 'language-chooser/remove',
			category: 'global',
			description: __( 'Remove from list' ),
			keyCombination: {
				character: 'Backspace',
			},
		} );

		registerShortcut( {
			name: 'language-chooser/add',
			category: 'global',
			description: _x( 'Add to list', 'language' ),
			keyCombination: {
				modifier: 'alt',
				character: 'a',
			},
		} );
	} );

	const [ preferredLanguages, setPreferredLanguages ] = useState<
		Language[]
	>( props.preferredLanguages );

	const [ selectedLanguage, setSelectedLanguage ] = useState< Language >(
		props.preferredLanguages[ 0 ]
	);

	const inactiveLocales = allLanguages.filter(
		( language ) =>
			! preferredLanguages.find(
				( { locale } ) => locale === language.locale
			)
	);

	const hasUninstalledPreferredLanguages = preferredLanguages.some(
		( { installed } ) => ! installed
	);

	useEffect( () => {
		if ( ! hasUninstalledPreferredLanguages ) {
			return;
		}

		const addSpinner = () => {
			const spinner = document.createElement( 'span' );
			spinner.className =
				'spinner language-install-spinner is-active language-chooser-spinner';

			const submit = document.querySelector( '#submit' );

			if ( ! submit ) {
				return;
			}

			submit.after( spinner );
		};

		const form = document.querySelector( 'form' );

		if ( ! form ) {
			return;
		}

		form.addEventListener( 'submit', addSpinner );

		return () => {
			form.removeEventListener( 'submit', addSpinner );
		};
	}, [ hasUninstalledPreferredLanguages ] );

	const onAddLanguage = ( locale: Language ) => {
		setPreferredLanguages( ( current ) => [ ...current, locale ] );
		setSelectedLanguage( locale );
	};

	return (
		// @ts-ignore
		<ShortcutProvider>
			<div className="language-chooser">
				<HiddenFormField preferredLanguages={ preferredLanguages } />
				<p>
					{ __(
						'Choose languages for displaying WordPress in, in order of preference.'
					) }
				</p>
				<ActiveLocales
					languages={ preferredLanguages }
					setLanguages={ setPreferredLanguages }
					showOptionSiteDefault={ showOptionSiteDefault }
					selectedLanguage={ selectedLanguage }
					setSelectedLanguage={ setSelectedLanguage }
				/>
				<InactiveLocales
					languages={ inactiveLocales }
					onAddLanguage={ onAddLanguage }
				/>
				{ hasMissingTranslations && <MissingTranslationsNotice /> }
			</div>
		</ShortcutProvider>
	);
}

export default LanguageChooser;
