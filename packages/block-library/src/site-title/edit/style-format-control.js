/**
 * WordPress dependencies
 */
import { ToolbarGroup, ToolbarButton } from '@wordpress/components';
import { formatBold, formatItalic } from '@wordpress/icons';

const BOLD_VALUE = '700';
const ITALIC_VALUE = 'italic';

function getNewTypographyStyle( isBold, isItalic ) {
	if ( ! isBold && ! isItalic ) {
		return {
			fontWeight: undefined,
			fontStyle: undefined,
		};
	}
	return {
		fontWeight: isBold ? BOLD_VALUE : '400',
		fontStyle: isItalic ? ITALIC_VALUE : 'normal',
	};
}

export default function StyleFormatControl( { typographyStyle, onChange } ) {
	const isBold = typographyStyle?.fontWeight === BOLD_VALUE;
	const isItalic = typographyStyle?.fontStyle === ITALIC_VALUE;

	return (
		<ToolbarGroup>
			<ToolbarButton
				icon={ formatBold }
				label="Bold"
				isPressed={ isBold }
				onClick={ () => {
					onChange( {
						...typographyStyle,
						...getNewTypographyStyle( ! isBold, isItalic ),
					} );
				} }
			/>
			<ToolbarButton
				icon={ formatItalic }
				label="Italic"
				isPressed={ isItalic }
				onClick={ () => {
					onChange( {
						...typographyStyle,
						...getNewTypographyStyle( isBold, ! isItalic ),
					} );
				} }
			/>
		</ToolbarGroup>
	);
}
