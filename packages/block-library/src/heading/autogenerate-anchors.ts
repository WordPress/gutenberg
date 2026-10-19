import removeAccents from 'remove-accents';

/**
 * Object map tracking anchors.
 */
const anchors: Record< string, string | null > = {};

/**
 * Returns the text without markup.
 *
 * @param text The text.
 *
 * @return The text without markup.
 */
const getTextWithoutMarkup = ( text: string ): string => {
	const dummyElement = document.createElement( 'div' );
	dummyElement.innerHTML = text;
	return dummyElement.innerText;
};

/**
 * Get the slug from the content.
 *
 * @param content The block content.
 *
 * @return Returns the slug.
 */
const getSlug = ( content: string ): string => {
	// Get the slug.
	return (
		removeAccents(
			// Compose letters typed as a base letter and an accent, so that
			// removeAccents() converts them like precomposed letters.
			getTextWithoutMarkup( content ).normalize( 'NFC' )
		)
			// Remove emoji variation selectors and enclosing marks, such as in "❤️" or "1️⃣".
			.replace( /[\p{Variation_Selector}\p{Me}]/gu, '' )
			// Convert anything that's not a letter, mark or number to a hyphen.
			// Marks are needed by scripts like Devanagari, Tamil and Bengali.
			.replace( /[^\p{L}\p{M}\p{N}]+/gu, '-' )
			// Convert to lowercase
			.toLowerCase()
			// Remove any remaining leading or trailing hyphens.
			.replace( /(^-+)|(-+$)/g, '' )
	);
};

/**
 * Generate the anchor for a heading.
 *
 * @param clientId The block ID.
 * @param content  The block content.
 *
 * @return Return the heading anchor.
 */
export const generateAnchor = (
	clientId: string,
	content: string
): string | null => {
	const slug = getSlug( content );
	// If slug is empty, then return null.
	// Returning null instead of an empty string allows us to check again when the content changes.
	if ( '' === slug ) {
		return null;
	}

	delete anchors[ clientId ];

	let anchor = slug;
	let i = 0;

	// If the anchor already exists in another heading, append -i.
	while ( Object.values( anchors ).includes( anchor ) ) {
		i += 1;
		anchor = slug + '-' + i;
	}

	return anchor;
};

/**
 * Set the anchor for a heading.
 *
 * @param clientId The block ID.
 * @param anchor   The block anchor.
 */
export const setAnchor = ( clientId: string, anchor: string | null ): void => {
	anchors[ clientId ] = anchor;
};
