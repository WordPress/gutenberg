const BOLD = '700';
const ITALIC = 'italic';

export default function useTypographyStyle( typographyStyle ) {
	const isBold = typographyStyle?.fontWeight === BOLD;
	const isItalic = typographyStyle?.fontStyle === ITALIC;

	function getNewTypographyStyle( newIsBold, newIsItalic ) {
		if ( ! newIsBold && ! newIsItalic ) {
			return {
				fontWeight: undefined,
				fontStyle: undefined,
			};
		}
		return {
			fontWeight: newIsBold ? BOLD : '400',
			fontStyle: newIsItalic ? ITALIC : 'normal',
		};
	}
	return {
		isBold,
		isItalic,
		boldToggleTypography: {
			...typographyStyle,
			...getNewTypographyStyle( ! isBold, isItalic ),
		},
		italicToggleTypography: {
			...typographyStyle,
			...getNewTypographyStyle( isBold, ! isItalic ),
		},
	};
}
