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

interface LanguageChooserProps {
	allLanguages: Language[];
	selectedLanguages: Language[];
	hasMissingTranslations?: boolean;
	showOptionSiteDefault?: boolean;
	onChange?: ( languages: Language[] ) => void;
}

function LanguageChooser( props: LanguageChooserProps ) {
	const {
		allLanguages,
		hasMissingTranslations = false,
		showOptionSiteDefault = false,
	} = props;

	const [ languages, _setLanguages ] = useState< Language[] >(
		props.selectedLanguages
	);

	function setLanguages( update: ( prev: Language[] ) => Language[] ) {
		_setLanguages( ( prev ) => {
			const newValues = update( prev );
			props.onChange?.( newValues );
			return newValues;
		} );
	}

	const [ activeLanguage, setActiveLanguage ] = useState< Language >(
		props.selectedLanguages[ 0 ]
	);

	const inactiveLocales = allLanguages.filter(
		( language ) =>
			! languages.find( ( { locale } ) => locale === language.locale )
	);

	const [ inactiveLanguage, setInactiveLanguage ] = useState(
		inactiveLocales[ 0 ]
	);

	useEffect( () => {
		if ( ! inactiveLanguage ) {
			setInactiveLanguage( inactiveLocales[ 0 ] );
		}
	}, [ inactiveLanguage, inactiveLocales ] );

	const installedLanguages = inactiveLocales.filter( ( { installed } ) =>
		Boolean( installed )
	);

	const availableLanguages = inactiveLocales.filter(
		( { installed } ) => ! installed
	);

	const onAddLanguage = ( locale: Language ) => {
		setLanguages( ( current ) => [ ...current, locale ] );
		setActiveLanguage( locale );
	};

	const isEmpty = languages.length === 0;
	const isMoveUpDisabled =
		! activeLanguage || languages[ 0 ]?.locale === activeLanguage?.locale;
	const isMoveDownDisabled =
		! activeLanguage ||
		languages[ languages.length - 1 ]?.locale === activeLanguage?.locale;
	const isRemoveDisabled = ! activeLanguage;

	const onAdd = () => {
		onAddLanguage( inactiveLanguage );

		const installedIndex = installedLanguages.findIndex(
			( { locale } ) => locale === inactiveLanguage.locale
		);

		const availableIndex = availableLanguages.findIndex(
			( { locale } ) => locale === inactiveLanguage.locale
		);

		let newSelected: Language | undefined;

		newSelected = installedLanguages[ installedIndex + 1 ];

		if ( ! newSelected && installedLanguages[ 0 ] !== inactiveLanguage ) {
			newSelected = installedLanguages[ 0 ];
		}

		if ( ! newSelected ) {
			newSelected = availableLanguages[ availableIndex + 1 ];

			if ( availableLanguages[ 0 ] !== inactiveLanguage ) {
				newSelected = availableLanguages[ 0 ];
			}
		}

		setInactiveLanguage( newSelected );

		speak( __( 'Locale added to list' ) );
	};

	const onRemove = () => {
		const foundIndex = languages.findIndex(
			( { locale } ) => locale === activeLanguage?.locale
		);

		setActiveLanguage(
			languages[ foundIndex + 1 ] || languages[ foundIndex - 1 ]
		);

		setLanguages( ( prevLanguages ) =>
			prevLanguages.filter(
				( { locale } ) => locale !== activeLanguage?.locale
			)
		);
		_setLanguages( ( prevLanguages ) =>
			prevLanguages.filter(
				( { locale } ) => locale !== activeLanguage?.locale
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
				( { locale } ) => locale === activeLanguage?.locale
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
				( { locale } ) => locale === activeLanguage?.locale
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
					setActiveLanguage( languages.at( 0 ) as Language );
					event.preventDefault();
				}
				break;
			// Select last item.
			case 'End':
				if ( ! isEmpty ) {
					setActiveLanguage( languages.at( -1 ) as Language );
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
				if ( event.altKey && inactiveLanguage ) {
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
			<p id={ instanceId }>
				{ __(
					'Choose languages for displaying WordPress in, in order of preference.'
				) }
			</p>
			<ActiveLocales
				languages={ languages }
				showOptionSiteDefault={ showOptionSiteDefault }
				activeLanguage={ activeLanguage }
				setActiveLanguage={ setActiveLanguage }
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
				inactiveLanguage={ inactiveLanguage }
				setInactiveLanguage={ setInactiveLanguage }
				installedLanguages={ installedLanguages }
				availableLanguages={ availableLanguages }
			/>
			{ hasMissingTranslations && <MissingTranslationsNotice /> }
		</div>
	);
}

export default LanguageChooser;
