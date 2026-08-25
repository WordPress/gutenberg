/**
 * Builds a span-aware cell placement map from the table's section blocks.
 *
 * A cell covered by a rowSpan from above is absent from its row's inner
 * blocks, and a colSpan'd cell occupies a single slot there, so the visual
 * column of a cell is derived by tracking occupied slots rather than using
 * its index within the row.
 *
 * @param {Array} sections Section blocks, with row blocks in `innerBlocks`.
 *
 * @return {Array} Array of placements:
 *                 { clientId, rowIndex, columnIndex, rowSpan, colSpan, sectionType }.
 */
export function getCellPlacements( sections ) {
	const placements = [];
	const occupiedSlots = new Map();
	let rowIndex = 0;

	for ( const section of sections ) {
		for ( const row of section.innerBlocks ) {
			let columnIndex = 0;
			for ( const cell of row.innerBlocks ) {
				while ( occupiedSlots.get( rowIndex )?.has( columnIndex ) ) {
					columnIndex++;
				}
				const { rowSpan = 1, colSpan = 1 } = cell.attributes;
				placements.push( {
					clientId: cell.clientId,
					rowIndex,
					columnIndex,
					rowSpan,
					colSpan,
					sectionType: section.attributes.type,
				} );
				for ( let rowOffset = 0; rowOffset < rowSpan; rowOffset++ ) {
					const occupiedRowIndex = rowIndex + rowOffset;
					if ( ! occupiedSlots.has( occupiedRowIndex ) ) {
						occupiedSlots.set( occupiedRowIndex, new Set() );
					}
					const occupiedRow = occupiedSlots.get( occupiedRowIndex );
					for (
						let columnOffset = 0;
						columnOffset < colSpan;
						columnOffset++
					) {
						occupiedRow.add( columnIndex + columnOffset );
					}
				}
				columnIndex += colSpan;
			}
			rowIndex++;
		}
	}

	return placements;
}
