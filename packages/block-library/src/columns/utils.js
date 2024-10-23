/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

/**
 * Returns a column width attribute value rounded to standard precision.
 * Returns `undefined` if the value is not a valid finite number.
 *
 * @param {?number} value Raw value.
 *
 * @return {number} Value rounded to standard precision.
 */
export const toWidthPrecision = ( value ) => {
	const unitlessValue = parseFloat( value );
	return Number.isFinite( unitlessValue )
		? parseFloat( unitlessValue.toFixed( 2 ) )
		: undefined;
};
/**
 * Returns an effective width for a given block. An effective width is equal to
 * its attribute value if set, or a computed value assuming equal distribution.
 *
 * @param {WPBlock} block           Block object.
 * @param {number}  totalBlockCount Total number of blocks in Columns.
 *
 * @return {number} Effective column width.
 */
export function getEffectiveColumnWidth( block, totalBlockCount ) {
	const { width = 100 / totalBlockCount } = block.attributes;
	return toWidthPrecision( width );
}

/**
 * Returns the total width occupied by the given set of column blocks.
 *
 * @param {WPBlock[]} blocks          Block objects.
 * @param {?number}   totalBlockCount Total number of blocks in Columns.
 *                                    Defaults to number of blocks passed.
 *
 * @return {number} Total width occupied by blocks.
 */
export function getTotalColumnsWidth(
	blocks,
	totalBlockCount = blocks.length
) {
	return blocks.reduce(
		( sum, block ) =>
			sum + getEffectiveColumnWidth( block, totalBlockCount ),
		0
	);
}

/**
 * Returns an object of `clientId` → `width` of effective column widths.
 *
 * @param {WPBlock[]} blocks          Block objects.
 * @param {?number}   totalBlockCount Total number of blocks in Columns.
 *                                    Defaults to number of blocks passed.
 *
 * @return {Object<string,number>} Column widths.
 */
export function getColumnWidths( blocks, totalBlockCount = blocks.length ) {
	return blocks.reduce( ( accumulator, block ) => {
		const width = getEffectiveColumnWidth( block, totalBlockCount );
		return Object.assign( accumulator, { [ block.clientId ]: width } );
	}, {} );
}

/**
 * Returns an object of `clientId` → `width` of column widths as redistributed
 * proportional to their current widths, constrained or expanded to fit within
 * the given available width.
 *
 * @param {WPBlock[]} blocks          Block objects.
 * @param {number}    availableWidth  Maximum width to fit within.
 * @param {?number}   totalBlockCount Total number of blocks in Columns.
 *                                    Defaults to number of blocks passed.
 *
 * @return {Object<string,number>} Redistributed column widths.
 */
export function getRedistributedColumnWidths(
	blocks,
	availableWidth,
	totalBlockCount = blocks.length
) {
	const totalWidth = getTotalColumnsWidth( blocks, totalBlockCount );

	return Object.fromEntries(
		Object.entries( getColumnWidths( blocks, totalBlockCount ) ).map(
			( [ clientId, width ] ) => {
				const newWidth = ( availableWidth * width ) / totalWidth;
				return [ clientId, toWidthPrecision( newWidth ) ];
			}
		)
	);
}

/**
 * Returns true if column blocks within the provided set are assigned with
 * explicit widths, or false otherwise.
 *
 * @param {WPBlock[]} blocks Block objects.
 *
 * @return {boolean} Whether columns have explicit widths.
 */
export function hasExplicitPercentColumnWidths( blocks ) {
	return blocks.every( ( block ) => {
		const blockWidth = block.attributes.width;
		return Number.isFinite(
			blockWidth?.endsWith?.( '%' )
				? parseFloat( blockWidth )
				: blockWidth
		);
	} );
}

/**
 * Returns a copy of the given set of blocks with new widths assigned from the
 * provided object of redistributed column widths.
 *
 * @param {WPBlock[]}             blocks Block objects.
 * @param {Object<string,number>} widths Redistributed column widths.
 *
 * @return {WPBlock[]} blocks Mapped block objects.
 */
export function getMappedColumnWidths( blocks, widths ) {
	return blocks.map( ( block ) => ( {
		...block,
		attributes: {
			...block.attributes,
			width: `${ widths[ block.clientId ] }%`,
		},
	} ) );
}

/**
 * Returns an array with columns widths values, parsed or no depends on `withParsing` flag.
 *
 * @param {WPBlock[]} blocks      Block objects.
 * @param {?boolean}  withParsing Whether value has to be parsed.
 *
 * @return {Array<number,string>} Column widths.
 */
export function getWidths( blocks, withParsing = true ) {
	return blocks.map( ( innerColumn ) => {
		const innerColumnWidth =
			innerColumn.attributes.width || 100 / blocks.length;

		return withParsing ? parseFloat( innerColumnWidth ) : innerColumnWidth;
	} );
}

/**
 * Returns a column width with unit.
 *
 * @param {string} width Column width.
 * @param {string} unit  Column width unit.
 *
 * @return {string} Column width with unit.
 */
export function getWidthWithUnit( width, unit ) {
	width = 0 > parseFloat( width ) ? '0' : width;

	if ( isPercentageUnit( unit ) ) {
		width = Math.min( width, 100 );
	}

	return `${ width }${ unit }`;
}

/**
 * Returns a boolean whether passed unit is percentage
 *
 * @param {string} unit Column width unit.
 *
 * @return {boolean} 	Whether unit is '%'.
 */
export function isPercentageUnit( unit ) {
	return unit === '%';
}

/**
 * Returns indexes of inner blocks that aren’t locked from removal and have no
 * inner blocks of their own.
 *
 * @param {Array} blockList A block list as returned by `getBlocks`.
 */
export function getDispensableIndexes( blockList ) {
	return blockList.reduce(
		( vacants, { attributes, innerBlocks: { length } }, index ) =>
			attributes.lock?.remove || length ? vacants : [ ...vacants, index ],
		[]
	);
}

/**
 * Creates new child Column blocks by adding or removing columns and revises
 * existant column widths to grant required or redistribute available space.
 * When removing columns it does not remove any that are locked or have their
 * own children.
 *
 * @param {Array}  currentBlocks Current inner blocks.
 * @param {number} newCount      New column count.
 */
export function getRevisedColumns( currentBlocks, newCount ) {
	const currentCount = currentBlocks.length;
	const hasExplicitWidths = hasExplicitPercentColumnWidths( currentBlocks );

	// Redistribute available width for existing inner blocks.
	const isAddingColumn = newCount > currentCount;

	let innerBlocks;
	if ( isAddingColumn && hasExplicitWidths ) {
		// If adding a new column, assign width to the new column equal to
		// as if it were `1 / columns` of the total available space.
		const newColumnWidth = toWidthPrecision( 100 / newCount );

		// Redistribute in consideration of pending block insertion as
		// constraining the available working width.
		const widths = getRedistributedColumnWidths(
			currentBlocks,
			100 - newColumnWidth
		);

		innerBlocks = [
			...getMappedColumnWidths( currentBlocks, widths ),
			...Array.from( {
				length: newCount - currentCount,
			} ).map( () => {
				return createBlock( 'core/column', {
					width: `${ newColumnWidth }%`,
				} );
			} ),
		];
	} else if ( isAddingColumn ) {
		innerBlocks = [
			...currentBlocks,
			...Array.from( {
				length: newCount - currentCount,
			} ).map( () => {
				return createBlock( 'core/column' );
			} ),
		];
	} else {
		// Removes dispensable columns.
		const dispensableIndexes = getDispensableIndexes( currentBlocks );
		const difference = currentCount - newCount;
		const indexesToRemove = dispensableIndexes.slice( -difference );
		innerBlocks = currentBlocks.filter(
			( item, index ) => ! indexesToRemove.includes( index )
		);

		if ( hasExplicitWidths ) {
			// Redistribute as if block is already removed.
			const widths = getRedistributedColumnWidths( innerBlocks, 100 );

			innerBlocks = getMappedColumnWidths( innerBlocks, widths );
		}
	}
	return innerBlocks;
}
