/**
 * External dependencies
 */
import { map } from 'lodash';
import scrollView from 'dom-scroll-into-view';
import classnames from 'classnames';
import type { MouseEventHandler } from 'react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { useRefEffect } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import type { SuggestionsListProps } from './types';

const handleMouseDown: MouseEventHandler = ( e ) => {
	// By preventing default here, we will not lose focus of <input> when clicking a suggestion.
	e.preventDefault();
};

export function SuggestionsList< T extends string | { value: string } >( {
	selectedIndex,
	scrollIntoView,
	match,
	onHover,
	onSelect,
	suggestions = [],
	displayTransform,
	instanceId,
}: SuggestionsListProps< T > ) {
	const [ scrollingIntoView, setScrollingIntoView ] = useState( false );

	const listRef = useRefEffect< HTMLUListElement >(
		( listNode ) => {
			// only have to worry about scrolling selected suggestion into view
			// when already expanded.
			let id: number;
			if (
				selectedIndex > -1 &&
				scrollIntoView &&
				listNode.children[ selectedIndex ]
			) {
				setScrollingIntoView( true );
				scrollView(
					listNode.children[ selectedIndex ] as HTMLLIElement,
					listNode,
					{
						onlyScrollIfNeeded: true,
					}
				);
				id = window.setTimeout( () => {
					setScrollingIntoView( false );
				}, 100 );
			}

			return () => {
				if ( id !== undefined ) {
					window.clearTimeout( id );
				}
			};
		},
		[ selectedIndex, scrollIntoView ]
	);

	const handleHover = ( suggestion: T ) => {
		return () => {
			if ( ! scrollingIntoView ) {
				onHover?.( suggestion );
			}
		};
	};

	const handleClick = ( suggestion: T ) => {
		return () => {
			onSelect?.( suggestion );
		};
	};

	const computeSuggestionMatch = ( suggestion: T ) => {
		const matchText = displayTransform( match ).toLocaleLowerCase();
		if ( matchText.length === 0 ) {
			return null;
		}

		const transformedSuggestion = displayTransform( suggestion );
		const indexOfMatch = transformedSuggestion
			.toLocaleLowerCase()
			.indexOf( matchText );

		return {
			suggestionBeforeMatch: transformedSuggestion.substring(
				0,
				indexOfMatch
			),
			suggestionMatch: transformedSuggestion.substring(
				indexOfMatch,
				indexOfMatch + matchText.length
			),
			suggestionAfterMatch: transformedSuggestion.substring(
				indexOfMatch + matchText.length
			),
		};
	};

	return (
		<ul
			ref={ listRef }
			className="components-form-token-field__suggestions-list"
			id={ `components-form-token-suggestions-${ instanceId }` }
			role="listbox"
		>
			{ map( suggestions, ( suggestion, index ) => {
				const matchText = computeSuggestionMatch( suggestion );
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
							typeof suggestion === 'object' &&
							'value' in suggestion
								? suggestion?.value
								: displayTransform( suggestion )
						}
						onMouseDown={ handleMouseDown }
						onClick={ handleClick( suggestion ) }
						onMouseEnter={ handleHover( suggestion ) }
						aria-selected={ index === selectedIndex }
					>
						{ matchText ? (
							<span aria-label={ displayTransform( suggestion ) }>
								{ matchText.suggestionBeforeMatch }
								<strong className="components-form-token-field__suggestion-match">
									{ matchText.suggestionMatch }
								</strong>
								{ matchText.suggestionAfterMatch }
							</span>
						) : (
							displayTransform( suggestion )
						) }
					</li>
				);
				/* eslint-enable jsx-a11y/click-events-have-key-events */
			} ) }
		</ul>
	);
}

export default SuggestionsList;
