/**
 * WordPress dependencies
 */
import { ToolbarButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
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
	function onClickBold() {
		onChange( {
			...typographyStyle,
			...getNewTypographyStyle( ! isBold, isItalic ),
		} );
	}
	function onClickItalic() {
		onChange( {
			...typographyStyle,
			...getNewTypographyStyle( isBold, ! isItalic ),
		} );
	}
	return (
		<>
			<ToolbarButton
				icon={ formatBold }
				label={ __( 'Bold' ) }
				isPressed={ isBold }
				onClick={ onClickBold }
			/>
			<ToolbarButton
				icon={ formatItalic }
				label={ __( 'Italic' ) }
				isPressed={ isItalic }
				onClick={ onClickItalic }
			/>
		</>
	);
}
