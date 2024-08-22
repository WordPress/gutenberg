/**
 * WordPress dependencies
 */
import { useLayoutEffect, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { speak } from '@wordpress/a11y';
// @ts-ignore
import { useShortcut } from '@wordpress/keyboard-shortcuts';

/**
 * Internal dependencies
 */
import { reorder } from '../utils';
import type { Language } from './types';
import ActiveControls from './active-controls';

interface ActiveLocalesProps {
	languages: Language[];
	selectedLanguage?: Language;
	showOptionSiteDefault?: boolean;
	setLanguages: ( cb: ( languages: Language[] ) => Language[] ) => void;
	setSelectedLanguage: ( language: Language ) => void;
}

export function ActiveLocales( {
	languages,
	setLanguages,
	showOptionSiteDefault = false,
	selectedLanguage,
	setSelectedLanguage,
}: ActiveLocalesProps ) {
	const listRef = useRef< HTMLUListElement | null >( null );

	const isEmpty = languages.length === 0;

	useLayoutEffect( () => {
		const selectedEl = listRef.current?.querySelector(
			'[aria-selected="true"]'
		);

		if ( ! selectedEl ) {
			return;
		}

		selectedEl.scrollIntoView( {
			behavior: 'smooth',
			block: 'nearest',
		} );
	}, [ selectedLanguage, languages ] );

	useShortcut( 'language-chooser/select-first', ( event: Event ) => {
		event.preventDefault();

		if ( isEmpty ) {
			return;
		}

		setSelectedLanguage( languages.at( 0 ) as Language );
	} );

	useShortcut( 'language-chooser/select-last', ( event: Event ) => {
		event.preventDefault();

		if ( isEmpty ) {
			return;
		}

		setSelectedLanguage( languages.at( -1 ) as Language );
	} );

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

	const activeDescendant = isEmpty ? '' : selectedLanguage?.locale;

	const className = isEmpty
		? 'active-locales-list empty-list'
		: 'active-locales-list';

	let emptyMessage = sprintf(
		/* translators: %s: English (United States) */
		__( 'Falling back to %s.' ),
		'English (United States)'
	);

	if ( showOptionSiteDefault ) {
		emptyMessage = __( 'Falling back to Site Default.' );
	}

	return (
		<div className="active-locales wp-clearfix">
			{ isEmpty && (
				<div className="active-locales-empty-message">
					{ __( 'Nothing set.' ) }
					<br />
					{ emptyMessage }
				</div>
			) }
			<ul
				role="listbox"
				aria-labelledby="language-chooser-label"
				tabIndex={ 0 }
				aria-activedescendant={ activeDescendant }
				className={ className }
				ref={ listRef }
			>
				{ languages.map( ( language ) => {
					const { locale, nativeName, lang } = language;
					return (
						// eslint-disable-next-line jsx-a11y/click-events-have-key-events
						<li
							key={ locale }
							role="option"
							aria-selected={
								locale === selectedLanguage?.locale
							}
							id={ locale }
							lang={ lang }
							className="active-locale"
							onClick={ () => setSelectedLanguage( language ) }
						>
							{ nativeName }
						</li>
					);
				} ) }
			</ul>
			<ActiveControls
				languages={ languages }
				selectedLanguage={ selectedLanguage }
				onMoveUp={ onMoveUp }
				onMoveDown={ onMoveDown }
				onRemove={ onRemove }
			/>
		</div>
	);
}

export default ActiveLocales;
