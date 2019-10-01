/**
 * WordPress dependencies
 */
import { Popover } from '@wordpress/components';

/**
 * Internal dependencies
 */
import FormatToolbar from './format-toolbar';

export default function InlineFormatToolbar() {
	return (
		<Popover
			noArrow
			focusOnMount={ false }
			className="block-editor-rich-text__inline-format-toolbar"
		>
			<FormatToolbar />
		</Popover>
	);
}
