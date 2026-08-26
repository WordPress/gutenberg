/**
 * Utility functions for the Feature Comparison Table block.
 */

/**
 * Generate a simple unique ID for block data items.
 * Uses crypto.randomUUID when available, falls back to Math.random.
 *
 * @return {string} Unique ID string.
 */
export function generateId() {
	if ( typeof crypto !== 'undefined' && crypto.randomUUID ) {
		return crypto.randomUUID();
	}
	return Math.random().toString( 36 ).slice( 2 ) + Date.now().toString( 36 );
}

/**
 * Get the cell map key for a feature/product pair.
 *
 * @param {string} featureId - The feature row ID.
 * @param {string} productId - The product column ID.
 * @return {string} The cell key.
 */
export function getCellKey( featureId, productId ) {
	return `${ featureId }_${ productId }`;
}

/**
 * Retrieve effective cell data for a feature/product pair.
 * Falls back to the feature row's defaultValue if no explicit cell data exists.
 *
 * @param {Object} cells     - The cells attribute map.
 * @param {Object} feature   - The feature row object.
 * @param {string} productId - The product column ID.
 * @return {Object} Cell data with type, value, text, and footnoteIds fields.
 */
export function getEffectiveCell( cells, feature, productId ) {
	const key = getCellKey( feature.id, productId );
	if ( cells[ key ] ) {
		return cells[ key ];
	}
	// Apply row default.
	if ( feature.defaultValue ) {
		return {
			type: 'icon',
			value: feature.defaultValue,
			text: '',
			footnoteIds: [],
		};
	}
	return { type: 'empty', value: '', text: '', footnoteIds: [] };
}

/**
 * Convert a 1-based index to a Roman numeral string (lowercase).
 *
 * @param {number} n - The number to convert.
 * @return {string} Roman numeral string.
 */
function toRoman( n ) {
	const vals = [ 1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1 ];
	const syms = [
		'm',
		'cm',
		'd',
		'cd',
		'c',
		'xc',
		'l',
		'xl',
		'x',
		'ix',
		'v',
		'iv',
		'i',
	];
	let result = '';
	for ( let i = 0; i < vals.length; i++ ) {
		while ( n >= vals[ i ] ) {
			result += syms[ i ];
			n -= vals[ i ];
		}
	}
	return result;
}

/**
 * Get a footnote label string for a 1-based index and style.
 *
 * @param {number} n     - 1-based index.
 * @param {string} style - 'numeric' | 'alphabetic' | 'roman' | 'asterisk'.
 * @return {string} The label string.
 */
export function getFootnoteLabel( n, style ) {
	switch ( style ) {
		case 'alphabetic':
			// a, b, c, ..., z, aa, ab, ...
			if ( n <= 26 ) {
				return String.fromCharCode( 96 + n );
			}
			return (
				String.fromCharCode( 96 + Math.floor( ( n - 1 ) / 26 ) ) +
				String.fromCharCode( 96 + ( ( ( n - 1 ) % 26 ) + 1 ) )
			);
		case 'roman':
			return toRoman( n );
		case 'asterisk':
			return '*'.repeat( n );
		case 'numeric':
		default:
			return String( n );
	}
}

/**
 * Build an ordered footnote index from the table data.
 *
 * Traverses the table in reading order (row by row, column by column) to
 * assign consistent labels to footnote references. Shared footnotes (referenced
 * from multiple cells) receive only one label, assigned at first appearance.
 *
 * @param {Array}  features  - Feature rows.
 * @param {Array}  products  - Product columns.
 * @param {Object} cells     - Cell map.
 * @param {Array}  footnotes - Footnote definitions.
 * @param {string} style     - Footnote label style.
 * @return {Array} Array of footnote objects with an added `label` property,
 *                 in order of first appearance.
 */
export function buildFootnoteIndex(
	features,
	products,
	cells,
	footnotes,
	style
) {
	// Map: footnoteId -> label string (assigned in table reading order).
	const seen = new Map();
	let counter = 1;

	for ( const feature of features ) {
		for ( const product of products ) {
			const cell = getEffectiveCell( cells, feature, product.id );
			if ( cell.footnoteIds ) {
				for ( const fId of cell.footnoteIds ) {
					if ( ! seen.has( fId ) ) {
						seen.set( fId, getFootnoteLabel( counter++, style ) );
					}
				}
			}
		}
	}

	// Return only footnotes that are actually referenced, in definition order,
	// with their assigned labels.
	return footnotes
		.filter( ( fn ) => seen.has( fn.id ) )
		.map( ( fn ) => ( { ...fn, label: seen.get( fn.id ) } ) );
}

/**
 * Get the footnote labels for a specific cell's footnoteIds list.
 *
 * @param {Array} footnoteIds   - Array of footnote IDs referenced by a cell.
 * @param {Array} footnoteIndex - Built footnote index from buildFootnoteIndex().
 * @return {Array} Ordered array of label strings for this cell.
 */
export function getCellFootnoteLabels( footnoteIds, footnoteIndex ) {
	if ( ! footnoteIds || footnoteIds.length === 0 ) {
		return [];
	}
	return footnoteIds
		.map( ( fId ) => footnoteIndex.find( ( fn ) => fn.id === fId ) )
		.filter( Boolean )
		.map( ( fn ) => fn.label );
}

/**
 * Icon type definitions for comparison cells.
 * Each entry has a label for UI display, a Unicode symbol, and an aria-label
 * for screen reader accessibility.
 */
export const ICON_TYPES = {
	tick: {
		label: 'Yes / Included',
		symbol: '✓',
		ariaLabel: 'Included',
	},
	cross: {
		label: 'No / Not included',
		symbol: '✕',
		ariaLabel: 'Not included',
	},
	warning: {
		label: 'Warning / Partial',
		symbol: '!',
		ariaLabel: 'Partial or conditional',
	},
};

/** Available feature label position options. */
export const FEATURE_POSITIONS = [
	{ label: 'Left', value: 'left' },
	{ label: 'Right', value: 'right' },
	{ label: 'Both sides', value: 'both' },
];

/** Header display mode options. */
export const HEADER_DISPLAY_OPTIONS = [
	{ label: 'Title only', value: 'title' },
	{ label: 'Image + title', value: 'image-title' },
	{ label: 'Image only', value: 'image-only' },
];

/** Footnote label style options. */
export const FOOTNOTE_STYLE_OPTIONS = [
	{ label: 'Numeric (1, 2, 3)', value: 'numeric' },
	{ label: 'Alphabetic (a, b, c)', value: 'alphabetic' },
	{ label: 'Roman (i, ii, iii)', value: 'roman' },
	{ label: 'Asterisk (*, **, ***)', value: 'asterisk' },
];

/** Footnote display position options. */
export const FOOTNOTE_DISPLAY_OPTIONS = [
	{ label: 'Superscript', value: 'superscript' },
	{ label: 'Inline', value: 'inline' },
	{ label: 'Subscript', value: 'subscript' },
];

/** Hover highlight mode options. */
export const HOVER_HIGHLIGHT_OPTIONS = [
	{ label: 'None', value: 'none' },
	{ label: 'Highlight row', value: 'row' },
	{ label: 'Highlight column', value: 'column' },
	{ label: 'Highlight both', value: 'both' },
];

/** Header rotation angle options. */
export const ROTATION_ANGLE_OPTIONS = [
	{ label: '-30°', value: -30 },
	{ label: '-45°', value: -45 },
	{ label: '-60°', value: -60 },
	{ label: '-90°', value: -90 },
];
