/**
 * WordPress dependencies
 */
import { Popover } from '@wordpress/components';

/**
 * Internal dependencies
 */
import FormatToolbar from './format-toolbar';

export default function InlineFormatToolbar( { editableRef } ) {
	return (
		<Popover
			noArrow
			position="top center"
			focusOnMount={ false }
			getAnchorRect={ () => editableRef.current.getBoundingClientRect() }
			className="block-editor-rich-text__inline-format-toolbar"
		>
			<FormatToolbar />
		</Popover>
	);
}
