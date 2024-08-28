/**
 * External dependencies
 */
import type { KeyboardEvent } from 'react';

/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { speak } from '@wordpress/a11y';
import { Notice } from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import ActiveLocales from './active-locales';
import InactiveLocales from './inactive-locales';
import type { Language } from './types';
import { reorder } from './utils';

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
	inputName: string;
}

function HiddenFormField( {
	preferredLanguages,
	inputName,
}: HiddenFormFieldProps ) {
	const value = preferredLanguages
		.filter( ( language ) => Boolean( language ) )
		.map( ( { locale } ) => locale )
		.join( ',' );

	return <input type="hidden" name={ inputName } value={ value } />;
}

interface LanguageChooserProps {
	allLanguages: Language[];
	preferredLanguages: Language[];
	hasMissingTranslations?: boolean;
	showOptionSiteDefault?: boolean;
	inputName?: string;
}

function LanguageChooser( props: LanguageChooserProps ) {
	const {
		allLanguages,
		hasMissingTranslations = false,
		showOptionSiteDefault = false,
		inputName,
	} = props;

	const [ languages, setLanguages ] = useState< Language[] >(
		props.preferredLanguages
	);

	const [ selectedLanguage, setSelectedLanguage ] = useState< Language >(
		props.preferredLanguages[ 0 ]
	);

	const inactiveLocales = allLanguages.filter(
		( language ) =>
			! languages.find( ( { locale } ) => locale === language.locale )
	);

	const [ selectedInactiveLanguage, setSelectedInactiveLanguage ] = useState(
		inactiveLocales[ 0 ]
	);

	useEffect( () => {
		if ( ! selectedInactiveLanguage ) {
			setSelectedInactiveLanguage( inactiveLocales[ 0 ] );
		}
	}, [ selectedInactiveLanguage, inactiveLocales ] );

	const installedLanguages = inactiveLocales.filter( ( { installed } ) =>
		Boolean( installed )
	);

	const availableLanguages = inactiveLocales.filter(
		( { installed } ) => ! installed
	);

	const hasUninstalledPreferredLanguages = languages.some(
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
		setLanguages( ( current ) => [ ...current, locale ] );
		setSelectedLanguage( locale );
	};

	const isEmpty = languages.length === 0;
	const isMoveUpDisabled =
		! selectedLanguage ||
		languages[ 0 ]?.locale === selectedLanguage?.locale;
	const isMoveDownDisabled =
		! selectedLanguage ||
		languages[ languages.length - 1 ]?.locale === selectedLanguage?.locale;
	const isRemoveDisabled = ! selectedLanguage;

	const onAdd = () => {
		onAddLanguage( selectedInactiveLanguage );

		const installedIndex = installedLanguages.findIndex(
			( { locale } ) => locale === selectedInactiveLanguage.locale
		);

		const availableIndex = availableLanguages.findIndex(
			( { locale } ) => locale === selectedInactiveLanguage.locale
		);

		let newSelected: Language | undefined;

		newSelected = installedLanguages[ installedIndex + 1 ];

		if (
			! newSelected &&
			installedLanguages[ 0 ] !== selectedInactiveLanguage
		) {
			newSelected = installedLanguages[ 0 ];
		}

		if ( ! newSelected ) {
			newSelected = availableLanguages[ availableIndex + 1 ];

			if ( availableLanguages[ 0 ] !== selectedInactiveLanguage ) {
				newSelected = availableLanguages[ 0 ];
			}
		}

		setSelectedInactiveLanguage( newSelected );

		speak( __( 'Locale added to list' ) );
	};

	const onRemove = () => {
		const foundIndex = languages.findIndex(
			( { locale } ) => locale === selectedLanguage?.locale
		);

		setSelectedLanguage(
			languages[ foundIndex + 1 ] || languages[ foundIndex - 1 ]
		);

		setLanguages( ( prevLanguages ) =>
			prevLanguages.filter(
				( { locale } ) => locale !== selectedLanguage?.locale
			)
		);

		speak( __( 'Locale removed from list' ) );

		if ( languages.length === 1 ) {
			let emptyMessageA11y = sprintf(
				/* translators: %s: English (United States) */
				__( 'No languages selected. Falling back to %s.' ),
				'English (United States)'
			);

			if ( showOptionSiteDefault ) {
				emptyMessageA11y = __(
					'No languages selected. Falling back to Site Default.'
				);
			}

			speak( emptyMessageA11y );
		}
	};

	const onMoveUp = () => {
		setLanguages( ( prevLanguages ) => {
			const srcIndex = prevLanguages.findIndex(
				( { locale } ) => locale === selectedLanguage?.locale
			);
			return reorder(
				Array.from( prevLanguages ),
				srcIndex,
				srcIndex - 1
			);
		} );

		speak( __( 'Locale moved up' ) );
	};

	const onMoveDown = () => {
		setLanguages( ( prevLanguages ) => {
			const srcIndex = prevLanguages.findIndex(
				( { locale } ) => locale === selectedLanguage?.locale
			);
			return reorder< Language[] >(
				Array.from( prevLanguages ),
				srcIndex,
				srcIndex + 1
			);
		} );

		speak( __( 'Locale moved down' ) );
	};

	const onKeyDown = ( event: KeyboardEvent< HTMLElement > ) => {
		switch ( event.code ) {
			// Move item up.
			case 'ArrowUp':
				if ( ! isMoveUpDisabled ) {
					onMoveUp();
					event.preventDefault();
				}
				break;
			// Move item down.
			case 'ArrowDown':
				if ( ! isMoveDownDisabled ) {
					onMoveDown();
					event.preventDefault();
				}
				break;
			// Select first item.
			case 'Home':
				if ( ! isEmpty ) {
					setSelectedLanguage( languages.at( 0 ) as Language );
					event.preventDefault();
				}
				break;
			// Select last item.
			case 'End':
				if ( ! isEmpty ) {
					setSelectedLanguage( languages.at( -1 ) as Language );
					event.preventDefault();
				}
				break;
			// Remove item.
			case 'Backspace':
				if ( ! isRemoveDisabled ) {
					onRemove();
					event.preventDefault();
				}
				break;
			// Add item.
			case 'KeyA':
				if ( event.altKey && selectedInactiveLanguage ) {
					onAdd();
					event.preventDefault();
				}
				break;
		}
	};

	const instanceId = useInstanceId( LanguageChooser, 'language-chooser' );

	return (
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<div className="language-chooser" onKeyDown={ onKeyDown }>
			<HiddenFormField
				preferredLanguages={ languages }
				inputName={ inputName || `${ instanceId }-languages` }
			/>
			<p id={ instanceId }>
				{ __(
					'Choose languages for displaying WordPress in, in order of preference.'
				) }
			</p>
			<ActiveLocales
				languages={ languages }
				setLanguages={ setLanguages }
				showOptionSiteDefault={ showOptionSiteDefault }
				selectedLanguage={ selectedLanguage }
				setSelectedLanguage={ setSelectedLanguage }
				onMoveUp={ onMoveUp }
				onMoveDown={ onMoveDown }
				onRemove={ onRemove }
				isEmpty={ isEmpty }
				isMoveUpDisabled={ isMoveUpDisabled }
				isMoveDownDisabled={ isMoveDownDisabled }
				isRemoveDisabled={ isRemoveDisabled }
				labelId={ instanceId }
			/>
			<InactiveLocales
				languages={ inactiveLocales }
				onAdd={ onAdd }
				selectedInactiveLanguage={ selectedInactiveLanguage }
				setSelectedInactiveLanguage={ setSelectedInactiveLanguage }
				installedLanguages={ installedLanguages }
				availableLanguages={ availableLanguages }
			/>
			{ hasMissingTranslations && <MissingTranslationsNotice /> }
		</div>
	);
}

export default LanguageChooser;
