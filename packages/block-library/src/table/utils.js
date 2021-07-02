/**
 * Generate CSS style object representing the colors contained in a custom
 * color set.
 *
 * @param {string} name       Color set name to create styles from
 * @param {Object} attributes Table block attributes.
 *
 * @return {Object} Custom color set inline styles.
 */
export const getColorStyles = ( name, attributes ) => {
	const colorSet = attributes?.style?.color?.sets?.[ name ];

	return {
		color: colorSet?.color,
		backgroundColor: colorSet?.background,
	};
};

/**
 * Returns CSS style object for the appropriate table section representing the
 * colors contained in the matching custom color set.
 *
 * @param {string}  name           Table section name.
 * @param {Object}  attributes     Table block attributes.
 * @param {number}  rowIndex       Index for current row.
 * @param {boolean} isStripedStyle Whether table has striped block style.
 *
 * @return {Object} Custom color set inline styles.
 */
export const getRowStyles = ( name, attributes, rowIndex, isStripedStyle ) => {
	if ( name === 'head' ) {
		return getColorStyles( 'header', attributes );
	}

	if ( name === 'foot' ) {
		return getColorStyles( 'footer', attributes );
	}

	// Striped styling only applies to table body.
	if ( isStripedStyle && rowIndex % 2 === 0 ) {
		return getColorStyles( 'secondary', attributes );
	}

	return {};
};
