/**
 * External dependencies
 */
import { map, deburr } from 'lodash';
import scrollView from 'dom-scroll-into-view';
import classnames from 'classnames';
import runes from 'runes';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { withSafeTimeout, useRefEffect } from '@wordpress/compose';

const emptyList = Object.freeze( [] );

const handleMouseDown = ( e ) => {
	// By preventing default here, we will not lose focus of <input> when clicking a suggestion.
	e.preventDefault();
};

function SuggestionsList( {
	selectedIndex,
	scrollIntoView,
	match = '',
	onHover,
	onSelect,
	suggestions = emptyList,
	displayTransform,
	instanceId,
	setTimeout,
	fuzzyMatch = false,
} ) {
	const [ scrollingIntoView, setScrollingIntoView ] = useState( false );

	const listRef = useRefEffect(
		( listNode ) => {
			// only have to worry about scrolling selected suggestion into view
			// when already expanded.
			if (
				selectedIndex > -1 &&
				scrollIntoView &&
				listNode.children[ selectedIndex ]
			) {
				setScrollingIntoView( true );
				scrollView( listNode.children[ selectedIndex ], listNode, {
					onlyScrollIfNeeded: true,
				} );
				setTimeout( () => {
					setScrollingIntoView( false );
				}, 100 );
			}
		},
		[ selectedIndex, scrollIntoView ]
	);

	const handleHover = ( suggestion ) => {
		return () => {
			if ( ! scrollingIntoView ) {
				onHover?.( suggestion );
			}
		};
	};

	const handleClick = ( suggestion ) => {
		return () => {
			onSelect?.( suggestion );
		};
	};

	const renderMatchText = ( suggestion ) => {
		if ( fuzzyMatch ) {
			return renderFuzzyMatchText(
				displayTransform( match || '' ),
				displayTransform( suggestion )
			);
		}

		const matchText = displayTransform( match || '' ).toLocaleLowerCase();
		if ( matchText.length === 0 ) {
			return null;
		}

		suggestion = displayTransform( suggestion );
		const indexOfMatch = suggestion
			.toLocaleLowerCase()
			.indexOf( matchText );

		return (
			<>
				{ suggestion.substring( 0, indexOfMatch ) }
				<strong className="components-form-token-field__suggestion-match">
					{ suggestion.substring(
						indexOfMatch,
						indexOfMatch + matchText.length
					) }
				</strong>
				{ suggestion.substring( indexOfMatch + matchText.length ) }
			</>
		);
	};

	// We set `tabIndex` here because otherwise Firefox sets focus on this
	// div when tabbing off of the input in `TokenField` -- not really sure
	// why, since usually a div isn't focusable by default
	// TODO does this still apply now that it's a <ul> and not a <div>?
	return (
		<ul
			ref={ listRef }
			className="components-form-token-field__suggestions-list"
			id={ `components-form-token-suggestions-${ instanceId }` }
			role="listbox"
		>
			{ map( suggestions, ( suggestion, index ) => {
				const suggestionText = displayTransform( suggestion );
				const matchText = renderMatchText( suggestion );
				const className = classnames(
					'components-form-token-field__suggestion',
					{
						'is-selected': index === selectedIndex,
					}
				);

				/* eslint-disable jsx-a11y/click-events-have-key-events */
				return (
					<li
						id={ `components-form-token-suggestions-${ instanceId }-${ index }` }
						role="option"
						className={ className }
						key={
							suggestion?.value
								? suggestion.value
								: suggestionText
						}
						onMouseDown={ handleMouseDown }
						onClick={ handleClick( suggestion ) }
						onMouseEnter={ handleHover( suggestion ) }
						aria-selected={ index === selectedIndex }
					>
						{ matchText ? (
							<span aria-label={ suggestionText }>
								{ matchText }
							</span>
						) : (
							suggestionText
						) }
					</li>
				);
				/* eslint-enable jsx-a11y/click-events-have-key-events */
			} ) }
		</ul>
	);
}

function renderFuzzyMatchText( needle = '', haystack = '' ) {
	const nrunes = runes( needle.toLocaleLowerCase() ).map( deburr );
	const nlen = nrunes.length;

	if ( nlen === 0 ) {
		return haystack;
	}

	const hrunes = runes( haystack.toLocaleLowerCase() ).map( deburr );
	const hlen = hrunes.length;

	if ( nlen === hlen && nrunes.join( '' ) === hrunes.join( '' ) ) {
		return <u>{ haystack }</u>;
	}

	const hrunesRaw = runes( haystack );

	const result = [];
	let h = 0;
	outer: for ( let n = 0; n < nlen; n++ ) {
		const nrune = nrunes[ n ];

		if ( nrune === ' ' ) {
			continue;
		}

		while ( h < hlen ) {
			const hruneRaw = hrunesRaw[ h ];
			const hrune = hrunes[ h ];
			h++;
			if ( hrune.indexOf( nrune ) >= 0 ) {
				result.push( <u key={ `${ n }:${ h }` }>{ hruneRaw }</u> );
				continue outer;
			}
			result.push( hruneRaw );
		}
	}

	if ( h < hlen ) {
		result.push( hrunesRaw.slice( h ) );
	}

	return result;
}

export default withSafeTimeout( SuggestionsList );
