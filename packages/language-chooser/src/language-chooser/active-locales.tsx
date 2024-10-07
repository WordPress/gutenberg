/**
 * WordPress dependencies
 */
import { useLayoutEffect, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { __experimentalText as Text } from '@wordpress/components';

/**
 * Internal dependencies
 */
import type { Language } from './types';
import ActiveControls from './active-controls';

interface ActiveLocalesProps {
	languages: Language[];
	activeLanguage?: Language;
	showOptionSiteDefault?: boolean;
	setActiveLanguage: ( language: Language ) => void;
	onMoveUp: () => void;
	onMoveDown: () => void;
	onRemove: () => void;
	isEmpty: boolean;
	isMoveUpDisabled: boolean;
	isMoveDownDisabled: boolean;
	isRemoveDisabled: boolean;
	labelId: string;
}

export function ActiveLocales( {
	languages,
	showOptionSiteDefault = false,
	activeLanguage,
	setActiveLanguage,
	onMoveUp,
	onMoveDown,
	onRemove,
	isEmpty,
	isMoveUpDisabled,
	isMoveDownDisabled,
	isRemoveDisabled,
	labelId,
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
	}, [ activeLanguage, languages ] );

	const activeDescendant = isEmpty ? '' : activeLanguage?.locale;

	const className = isEmpty
		? 'language-chooser__active-locales-list language-chooser__active-locales-list--empty'
		: 'language-chooser__active-locales-list';

	let emptyMessage = sprintf(
		/* translators: Used in language chooser, indicating fall back to the site's default language. %s: English (United States) */
		__( 'Falling back to %s.' ),
		'English (United States)'
	);

	if ( showOptionSiteDefault ) {
		/* translators: Used in language chooser, indicating fall back to the site's default language. */
		emptyMessage = __( 'Falling back to Site Default.' );
	}

	return (
		<div className="language-chooser__active-locales">
			{ isEmpty && (
				<div className="language-chooser__active-locales-empty-message">
					<Text>{ __( 'Nothing set.' ) }</Text>
					<Text>{ emptyMessage }</Text>
				</div>
			) }
			<ul
				role="listbox"
				aria-labelledby={ labelId }
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
							aria-selected={ locale === activeLanguage?.locale }
							id={ locale }
							lang={ lang }
							className="language-chooser__active-locale"
							onClick={ () => setActiveLanguage( language ) }
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
