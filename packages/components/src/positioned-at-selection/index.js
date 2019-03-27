/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { getOffsetParent, getRectangleFromRange } from '@wordpress/dom';

/**
 * Returns a style object for applying as `position: absolute` for an element
 * relative to the bottom-center of the current selection. Includes `top` and
 * `left` style properties.
 *
 * @return {Object} Style object.
 */
function getCurrentCaretPositionStyle() {
	const selection = window.getSelection();

	// Unlikely, but in the case there is no selection, return empty styles so
	// as to avoid a thrown error by `Selection#getRangeAt` on invalid index.
	if ( selection.rangeCount === 0 ) {
		return {};
	}

	// Get position relative viewport.
	const rect = getRectangleFromRange( selection.getRangeAt( 0 ) );
	let top = rect.top + rect.height;
	let left = rect.left + ( rect.width / 2 );

	// Offset by positioned parent, if one exists.
	const offsetParent = getOffsetParent( selection.anchorNode );
	if ( offsetParent ) {
		const parentRect = offsetParent.getBoundingClientRect();
		top -= parentRect.top;
		left -= parentRect.left;
	}

	return { top, left };
}

/**
 * Component which renders itself positioned under the current caret selection.
 * The position is calculated at the time of the component being mounted, so it
 * should only be mounted after the desired selection has been made.
 *
 * @type {WPComponent}
 */
export default class PositionedAtSelection extends Component {
	constructor() {
		super( ...arguments );

		this.state = {
			style: getCurrentCaretPositionStyle(),
		};
	}

	render() {
		const { children } = this.props;
		const { style } = this.state;

		return (
			<div className="editor-format-toolbar__selection-position block-editor-format-toolbar__selection-position" style={ style }>
				{ children }
			</div>
		);
	}
}
