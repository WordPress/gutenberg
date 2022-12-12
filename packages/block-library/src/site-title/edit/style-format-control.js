/**
 * WordPress dependencies
 */
import { ToolbarGroup, ToolbarButton } from '@wordpress/components';
import { formatBold, formatItalic } from '@wordpress/icons';

const BOLD_VALUE = '700';
const ITALIC_VALUE = 'italic';

export default function StyleFormatControl( { attributesStyle, onChange } ) {
	const isBold = attributesStyle?.typography?.fontWeight === BOLD_VALUE;
	const isItalic = attributesStyle?.typography?.fontStyle === ITALIC_VALUE;
	return (
		<ToolbarGroup>
			<ToolbarButton
				icon={ formatBold }
				label="Bold"
				isPressed={ isBold }
				onClick={ () => {
					onChange( {
						...attributesStyle?.typography,
						fontWeight: isBold ? undefined : BOLD_VALUE,
					} );
				} }
			/>
			<ToolbarButton
				icon={ formatItalic }
				label="Italic"
				isPressed={ isItalic }
				onClick={ () => {
					onChange( {
						...attributesStyle?.typography,
						fontStyle: isItalic ? undefined : ITALIC_VALUE,
					} );
				} }
			/>
		</ToolbarGroup>
	);
}
