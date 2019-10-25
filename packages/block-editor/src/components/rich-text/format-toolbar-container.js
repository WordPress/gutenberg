/**
 * WordPress dependencies
 */
import { Popover } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockFormatControls from '../block-format-controls';
import FormatToolbar from './format-toolbar';

const getAnchorRect = ( anchorObj ) => {
	const { current } = anchorObj;
	const rect = current.getBoundingClientRect();

	// Add some space.
	const buffer = 6;

	// Subtract padding if any.
	let { paddingTop } = window.getComputedStyle( current );

	paddingTop = parseInt( paddingTop, 10 );

	return {
		x: rect.left,
		y: rect.top + paddingTop - buffer,
		width: rect.width,
		height: rect.height - paddingTop + buffer,
		left: rect.left,
		right: rect.right,
		top: rect.top + paddingTop - buffer,
		bottom: rect.bottom,
	};
};

const FormatToolbarContainer = ( { inline, anchorObj } ) => {
	if ( inline ) {
		// Render in popover
		return (
			<Popover
				noArrow
				position="top center"
				focusOnMount={ false }
				getAnchorRect={ getAnchorRect( anchorObj ) }
				className="block-editor-rich-text__inline-format-toolbar"
			>
				<FormatToolbar />
			</Popover>
		);
	}
	// Render regular toolbar
	return (
		<BlockFormatControls>
			<FormatToolbar />
		</BlockFormatControls>
	);
};

export default FormatToolbarContainer;
