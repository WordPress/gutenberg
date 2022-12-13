const BOLD = '700';
const ITALIC = 'italic';

export default function useTypographyStyle( style, setAttributes ) {
	const typographyStyle = style?.typography;
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

	function toggleBold() {
		setAttributes( {
			style: {
				typography: {
					...typographyStyle,
					...getNewTypographyStyle( ! isBold, isItalic ),
				},
			},
		} );
	}

	function toggleItalic() {
		setAttributes( {
			style: {
				typography: {
					...typographyStyle,
					...getNewTypographyStyle( isBold, ! isItalic ),
				},
			},
		} );
	}

	return {
		isBold,
		isItalic,
		toggleBold,
		toggleItalic,
	};
}
