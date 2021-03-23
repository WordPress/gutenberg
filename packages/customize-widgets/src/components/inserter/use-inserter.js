/**
 * WordPress dependencies
 */
import { useState, useEffect, useRef } from '@wordpress/element';
import { focus } from '@wordpress/dom';
import { ESCAPE } from '@wordpress/keycodes';

const {
	wp: { customize },
} = window;

export const inserterId = 'widgets-inserter';

const OuterSection = customize.OuterSection;
// Override the OuterSection class to handle multiple outer sections.
// It closes all the other outer sections whenever one is opened.
// The result is that at most one outer section can be opened at the same time.
customize.OuterSection = class extends OuterSection {
	onChangeExpanded( expanded, args ) {
		if ( expanded ) {
			customize.section.each( ( section ) => {
				if (
					section.params.type === 'outer' &&
					section.id !== this.id
				) {
					if ( section.expanded() ) {
						section.collapse();
					}
				}
			} );
		}

		return super.onChangeExpanded( expanded, args );
	}
};
// Handle constructor so that "params.type" can be correctly pointed to "outer".
customize.sectionConstructor.outer = customize.OuterSection;

export const useInserterContainer = () =>
	document.getElementById( `sub-accordion-section-${ inserterId }` );

export default function useInserter() {
	const inserterRef = useRef( customize.section( inserterId ) );

	if ( ! inserterRef.current ) {
		inserterRef.current = new customize.OuterSection( inserterId, {} );

		customize.section.add( inserterRef.current );
	}

	const [ isInserterOpened, setIsInserterOpened ] = useState( () =>
		inserterRef.current.expanded()
	);

	// This is useful when the expanded state is controlled from outside React,
	// like when handling multiple outer sections above.
	useEffect( () => {
		const inserter = inserterRef.current;

		function syncExpandedStateToComponentState( expanded ) {
			setIsInserterOpened( expanded );
		}

		inserter.expanded.bind( syncExpandedStateToComponentState );

		return () => {
			inserter.expanded.unbind( syncExpandedStateToComponentState );
		};
	}, [] );

	useEffect(
		function syncOpenedStateToOuterSectionExpandedState() {
			const inserter = inserterRef.current;

			if ( isInserterOpened ) {
				const contentContainer = inserter.contentContainer[ 0 ];
				const activeElementBeforeExpanded =
					contentContainer.ownerDocument.activeElement;

				inserter.expand( {
					completeCallback() {
						// We have to do this in a "completeCallback" or else the elements will not yet be visible/tabbable.
						// The first one should be the close button,
						// we want to skip it and choose the second one instead, which is the search box.
						const searchBox = focus.tabbable.find(
							contentContainer
						)[ 1 ];
						if ( searchBox ) {
							searchBox.focus();
						}
					},
				} );

				return () => {
					if ( inserter.expanded() ) {
						const activeElement =
							contentContainer.ownerDocument.activeElement;

						// Return back the focus when closing the inserter.
						// Only do this if the active element which triggers the action is inside the inserter,
						// (the close button for instance). In that case the focus will be lost.
						// Otherwise, we don't hijack the focus when the user is focusing on other elements
						// (like the quick inserter).
						if ( contentContainer.contains( activeElement ) ) {
							inserter.collapse( {
								completeCallback() {
									// Return back the focus when closing the inserter.
									if ( activeElementBeforeExpanded ) {
										activeElementBeforeExpanded.focus();
									}
								},
							} );
						}
					}
				};
			}

			if ( inserter.expanded() ) {
				inserter.collapse();
			}
		},
		[ isInserterOpened ]
	);

	// Handle closing the inserter when pressing the Escape key.
	useEffect( () => {
		if ( isInserterOpened ) {
			const ownerWindow =
				inserterRef.current.contentContainer[ 0 ].ownerDocument
					.defaultView;

			function handlePressEscapeKey( event ) {
				if ( event.keyCode === ESCAPE || event.code === 'Escape' ) {
					event.stopPropagation();

					setIsInserterOpened( false );
				}
			}

			ownerWindow.addEventListener(
				'keydown',
				handlePressEscapeKey,
				true
			);

			return () => {
				ownerWindow.removeEventListener(
					'keydown',
					handlePressEscapeKey,
					true
				);
			};
		}
	}, [ isInserterOpened ] );

	return [ isInserterOpened, setIsInserterOpened ];
}
