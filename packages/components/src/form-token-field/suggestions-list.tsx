/**
 * External dependencies
 */
import { map } from 'lodash';
import scrollView from 'dom-scroll-into-view';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { useRefEffect } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import type { SuggestionsListProps } from './types';

const handleMouseDown = ( e ) => {
	// By preventing default here, we will not lose focus of <input> when clicking a suggestion.
	e.preventDefault();
};

export function SuggestionsList( {
	selectedIndex,
	scrollIntoView,
	match = '',
	onHover,
	onSelect,
	suggestions = [],
	displayTransform,
	instanceId,
}: SuggestionsListProps ) {
	const [ scrollingIntoView, setScrollingIntoView ] = useState( false );

	const listRef = useRefEffect< HTMLUListElement >(
		( listNode ) => {
			// only have to worry about scrolling selected suggestion into view
			// when already expanded.
			const { ownerDocument } = listNode;
			const { defaultView } = ownerDocument;
			let id;
			if (
				selectedIndex > -1 &&
				scrollIntoView &&
				listNode.children[ selectedIndex ]
			) {
				setScrollingIntoView( true );
				scrollView( listNode.children[ selectedIndex ], listNode, {
					onlyScrollIfNeeded: true,
				} );
				id = defaultView.setTimeout( () => {
					setScrollingIntoView( false );
				}, 100 );
			}

			return () => {
				if ( id !== undefined ) {
					defaultView.clearTimeout( id );
				}
			};
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

	const computeSuggestionMatch = ( suggestion ) => {
		const matchText = displayTransform( match || '' ).toLocaleLowerCase();
		if ( matchText.length === 0 ) {
			return null;
		}

		suggestion = displayTransform( suggestion );
		const indexOfMatch = suggestion
			.toLocaleLowerCase()
			.indexOf( matchText );

		return {
			suggestionBeforeMatch: suggestion.substring( 0, indexOfMatch ),
			suggestionMatch: suggestion.substring(
				indexOfMatch,
				indexOfMatch + matchText.length
			),
			suggestionAfterMatch: suggestion.substring(
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
