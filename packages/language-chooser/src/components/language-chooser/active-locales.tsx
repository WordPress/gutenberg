/**
 * WordPress dependencies
 */
import { useLayoutEffect, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { Language } from './types';
import ActiveControls from './active-controls';

interface ActiveLocalesProps {
	languages: Language[];
	selectedLanguage?: Language;
	showOptionSiteDefault?: boolean;
	setLanguages: ( cb: ( languages: Language[] ) => Language[] ) => void;
	setSelectedLanguage: ( language: Language ) => void;
	onMoveUp: () => void;
	onMoveDown: () => void;
	onRemove: () => void;
	isEmpty: boolean;
	isMoveUpDisabled: boolean;
	isMoveDownDisabled: boolean;
	isRemoveDisabled: boolean;
}

export function ActiveLocales( {
	languages,
	showOptionSiteDefault = false,
	selectedLanguage,
	setSelectedLanguage,
	onMoveUp,
	onMoveDown,
	onRemove,
	isEmpty,
	isMoveUpDisabled,
	isMoveDownDisabled,
	isRemoveDisabled,
}: ActiveLocalesProps ) {
	const listRef = useRef< HTMLUListElement | null >( null );

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
				onMoveUp={ onMoveUp }
				onMoveDown={ onMoveDown }
				onRemove={ onRemove }
				isMoveUpDisabled={ isMoveUpDisabled }
				isMoveDownDisabled={ isMoveDownDisabled }
				isRemoveDisabled={ isRemoveDisabled }
			/>
		</div>
	);
}

export default ActiveLocales;
