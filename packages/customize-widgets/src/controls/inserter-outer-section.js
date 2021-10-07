/**
 * WordPress dependencies
 */
import { ESCAPE } from '@wordpress/keycodes';
import { focus } from '@wordpress/dom';
import { dispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as customizeWidgetsStore } from '../store';

export default function getInserterOuterSection() {
	const {
		wp: { customize },
	} = window;

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

	return class InserterOuterSection extends customize.OuterSection {
		constructor( ...args ) {
			super( ...args );

			// This is necessary since we're creating a new class which is not identical to the original OuterSection.
			// @See https://github.com/WordPress/wordpress-develop/blob/42b05c397c50d9dc244083eff52991413909d4bd/src/js/_enqueues/wp/customize/controls.js#L1427-L1436
			this.params.type = 'outer';

			this.activeElementBeforeExpanded = null;

			const ownerWindow = this.contentContainer[ 0 ].ownerDocument
				.defaultView;

			// Handle closing the inserter when pressing the Escape key.
			ownerWindow.addEventListener(
				'keydown',
				( event ) => {
					if (
						this.expanded() &&
						( event.keyCode === ESCAPE ||
							event.code === 'Escape' ) &&
						! event.defaultPrevented
					) {
						event.preventDefault();
						event.stopPropagation();
						dispatch( customizeWidgetsStore ).setIsInserterOpened(
							false
						);
					}
				},
				// Use capture mode to make this run before other event listeners.
				true
			);

			this.contentContainer.addClass( 'widgets-inserter' );

			// Set a flag if the state is being changed from open() or close().
			// Don't propagate the event if it's an internal action to prevent infinite loop.
			this.isFromInternalAction = false;
			this.expanded.bind( () => {
				if ( ! this.isFromInternalAction ) {
					// Propagate the event to React to sync the state.
					dispatch( customizeWidgetsStore ).setIsInserterOpened(
						this.expanded()
					);
				}
				this.isFromInternalAction = false;
			} );
		}
		open() {
			if ( ! this.expanded() ) {
				const contentContainer = this.contentContainer[ 0 ];
				this.activeElementBeforeExpanded =
					contentContainer.ownerDocument.activeElement;

				this.isFromInternalAction = true;

				this.expand( {
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
			}
		}
		close() {
			if ( this.expanded() ) {
				const contentContainer = this.contentContainer[ 0 ];
				const activeElement =
					contentContainer.ownerDocument.activeElement;

				this.isFromInternalAction = true;

				this.collapse( {
					completeCallback() {
						// Return back the focus when closing the inserter.
						// Only do this if the active element which triggers the action is inside the inserter,
						// (the close button for instance). In that case the focus will be lost.
						// Otherwise, we don't hijack the focus when the user is focusing on other elements
						// (like the quick inserter).
						if ( contentContainer.contains( activeElement ) ) {
							// Return back the focus when closing the inserter.
							if ( this.activeElementBeforeExpanded ) {
								this.activeElementBeforeExpanded.focus();
							}
						}
					},
				} );
			}
		}
	};
}
