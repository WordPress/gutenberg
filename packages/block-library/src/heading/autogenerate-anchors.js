import removeAccents from 'remove-accents';

/**
 * Object map tracking anchors.
 *
 * @type {Record<string, string | null>}
 */
const anchors = {};

/**
 * Returns the text without markup.
 *
 * @param {string} text The text.
 *
 * @return {string} The text without markup.
 */
const getTextWithoutMarkup = ( text ) => {
	const dummyElement = document.createElement( 'div' );
	dummyElement.innerHTML = text;
	return dummyElement.innerText;
};

/**
 * Get the slug from the content.
 *
 * @param {string} content The block content.
 *
 * @return {string} Returns the slug.
 */
const getSlug = ( content ) => {
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
 * @param {string} clientId The block ID.
 * @param {string} content  The block content.
 *
 * @return {string|null} Return the heading anchor.
 */
export const generateAnchor = ( clientId, content ) => {
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
 * @param {string}      clientId The block ID.
 * @param {string|null} anchor   The block anchor.
 */
export const setAnchor = ( clientId, anchor ) => {
	anchors[ clientId ] = anchor;
};
