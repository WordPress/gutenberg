/**
 * WordPress dependencies
 */
import {
	withConstrainedTabbing,
	withFocusReturn,
	withFocusOutside,
} from '@wordpress/components';
import { Component } from '@wordpress/element';
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

export default function PopoverWrapper( { onClose, children, className } ) {
	// Event handlers
	const maybeClose = ( event ) => {
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

	// Disable reason: this stops certain events from propagating outside of the component.
	//   - onMouseDown is disabled as this can cause interactions with other DOM elements
	/* eslint-disable jsx-a11y/no-static-element-interactions */
	return (
		<div
			className={ className }
			onKeyDown={ maybeClose }
			onMouseDown={ stopPropagation }
		>
			<DetectOutside onFocusOutside={ onClose }>
				<FocusManaged>{ children }</FocusManaged>
			</DetectOutside>
		</div>
	);
	/* eslint-enable jsx-a11y/no-static-element-interactions */
}
