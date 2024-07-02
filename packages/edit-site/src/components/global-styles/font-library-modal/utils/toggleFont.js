/**
 * Toggles the activation of a given font or font variant within a list of custom fonts.
 *
 * - If only the font is provided (without face), the entire font family's activation is toggled.
 * - If both font and face are provided, the activation of the specific font variant is toggled.
 *
 * @param {Object} font            - The font to be toggled.
 * @param {string} font.slug       - The unique identifier for the font.
 * @param {Array}  [font.fontFace] - The list of font variants (faces) associated with the font.
 *
 * @param {Object} [face]          - The specific font variant to be toggled.
 * @param {string} face.fontWeight - The weight of the font variant.
 * @param {string} face.fontStyle  - The style of the font variant.
 *
 * @param {Array}  initialfonts    - The initial list of custom fonts.
 *
 * @return {Array} - The updated list of custom fonts with the font/font variant toggled.
 *
 * @example
 * const customFonts = [
 *     { slug: 'roboto', fontFace: [{ fontWeight: '400', fontStyle: 'normal' }] }
 * ];
 *
 * toggleFont({ slug: 'roboto' }, null, customFonts);
 * // This will remove 'roboto' from customFonts
 *
 * toggleFont({ slug: 'roboto' }, { fontWeight: '400', fontStyle: 'normal' }, customFonts);
 * // This will remove the specified face from 'roboto' in customFonts
 *
 * toggleFont({ slug: 'roboto' }, { fontWeight: '500', fontStyle: 'normal' }, customFonts);
 * // This will add the specified face to 'roboto' in customFonts
 */
export function toggleFont( font, face, initialfonts ) {
	// Helper to check if a font is activated based on its slug
	const isFontActivated = ( f ) => f.slug === font.slug;

	// Helper to get the activated font from a list of fonts
	const getActivatedFont = ( fonts ) => fonts.find( isFontActivated );

	// Toggle the activation status of an entire font family
	const toggleEntireFontFamily = ( activatedFont ) => {
		if ( ! activatedFont ) {
			// If the font is not active, activate the entire font family
			return [ ...initialfonts, font ];
		}
		// If the font is already active, deactivate the entire font family
		return initialfonts.filter( ( f ) => ! isFontActivated( f ) );
	};

	// Toggle the activation status of a specific font variant
	const toggleFontVariant = ( activatedFont ) => {
		const isFaceActivated = ( f ) =>
			f.fontWeight === face.fontWeight && f.fontStyle === face.fontStyle;

		if ( ! activatedFont ) {
			// If the font family is not active, activate the font family with the font variant
			return [ ...initialfonts, { ...font, fontFace: [ face ] } ];
		}

		let newFontFaces = activatedFont.fontFace || [];

		if ( newFontFaces.find( isFaceActivated ) ) {
			// If the font variant is active, deactivate it
			newFontFaces = newFontFaces.filter(
				( f ) => ! isFaceActivated( f )
			);
		} else {
			// If the font variant is not active, activate it
			newFontFaces = [ ...newFontFaces, face ];
		}

		// If there are no more font faces, deactivate the font family
		if ( newFontFaces.length === 0 ) {
			return initialfonts.filter( ( f ) => ! isFontActivated( f ) );
		}

		// Return updated fonts list with toggled font variant
		return initialfonts.map( ( f ) =>
			isFontActivated( f ) ? { ...f, fontFace: newFontFaces } : f
		);
	};

	const activatedFont = getActivatedFont( initialfonts );

	if ( ! face ) {
		return toggleEntireFontFamily( activatedFont );
	}

	return toggleFontVariant( activatedFont );
}
