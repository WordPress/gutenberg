/**
 * WordPress dependencies
 */
import {
	withConstrainedTabbing,
	withFocusReturn,
	withFocusOutside,
} from '@wordpress/components';
import { focus } from '@wordpress/dom';
import { Component, useEffect, useRef } from '@wordpress/element';
import { ESCAPE, UP, RIGHT, DOWN, LEFT } from '@wordpress/keycodes';

const ARROW_KEYCODES = [ UP, RIGHT, DOWN, LEFT ];

function stopPropagation( event ) {
	event.stopPropagation();
}

const DetectOutside = withFocusOutside(
	class extends Component {
		handleFocusOutside( event ) {
			this.props.onFocusOutside( event );
		}

		render() {
			return this.props.children;
		}
	}
);

const FocusManaged = withConstrainedTabbing(
	withFocusReturn( ( { children } ) => children )
);

/**
 * Hook used to focus the first tabbable element on mount.
 *
 * @param {boolean|string} focusOnMount Focus on mount mode.
 * @param {Object}         contentRef   Reference to the popover content element.
 */
function useFocusContentOnMount( focusOnMount, contentRef ) {
	// Focus handling
	useEffect( () => {
		/*
		 * Without the setTimeout, the dom node is not being focused. Related:
		 * https://stackoverflow.com/questions/35522220/react-ref-with-focus-doesnt-work-without-settimeout-my-example
		 *
		 * TODO: Treat the cause, not the symptom.
		 */
		const focusTimeout = setTimeout( () => {
			if ( ! focusOnMount || ! contentRef.current ) {
				return;
			}

			if ( focusOnMount === 'firstElement' ) {
				// Find first tabbable node within content and shift focus, falling
				// back to the popover panel itself.
				const firstTabbable = focus.tabbable.find(
					contentRef.current
				)[ 0 ];

				if ( firstTabbable ) {
					firstTabbable.focus();
				} else {
					contentRef.current.focus();
				}

				return;
			}

			if ( focusOnMount === 'container' ) {
				// Focus the popover panel itself so items in the popover are easily
				// accessed via keyboard navigation.
				contentRef.current.focus();
			}
		}, 0 );

		return () => clearTimeout( focusTimeout );
	}, [] );
}

export default function PopoverWrapper( {
	onClose,
	focusOnMount = 'firstElement',
	children,
	className,
} ) {
	// Event handlers
	const onKeyDown = ( event ) => {
		if ( ARROW_KEYCODES.includes( event.keyCode ) ) {
			// Prevent WritingFlow from triggering a block focus change.
			event.stopPropagation();
		}

		if ( event.keyCode === ESCAPE && onClose ) {
			// Close on escape
			event.stopPropagation();
			onClose();
		}
	};

	const contentRef = useRef();

	useFocusContentOnMount( focusOnMount, contentRef );

	// Disable reason: this stops certain events from propagating outside of the component.
	//   - onMouseDown is disabled as this can cause interactions with other DOM elements
	/* eslint-disable jsx-a11y/no-static-element-interactions */
	return (
		<div
			ref={ contentRef }
			className={ className }
			onKeyDown={ onKeyDown }
			onMouseDown={ stopPropagation }
		>
			<DetectOutside onFocusOutside={ onClose }>
				<FocusManaged>{ children }</FocusManaged>
			</DetectOutside>
		</div>
	);
	/* eslint-enable jsx-a11y/no-static-element-interactions */
}
