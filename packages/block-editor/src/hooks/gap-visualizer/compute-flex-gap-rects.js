/**
 * Pure engine for computing visual gap rectangles for CSS flexbox containers.
 *
 * All coordinates are unscaled container local CSS pixels relative to the container's
 * border-box origin (0, 0), preserving fractional subpixels to avoid rounding seam gaps.
 */

const MIN_GAP_SIZE = 0.5;
const LINE_OVERLAP_THRESHOLD = 0.5;

/**
 * @typedef {Object} GapRect
 * @property {'column'|'row'} type   Gap type.
 * @property {number}         left   Left coordinate in unscaled container pixels.
 * @property {number}         top    Top coordinate in unscaled container pixels.
 * @property {number}         width  Width in unscaled container pixels.
 * @property {number}         height Height in unscaled container pixels.
 * @property {number}         right  Right coordinate in unscaled container pixels.
 * @property {number}         bottom Bottom coordinate in unscaled container pixels.
 */

/**
 * @typedef {Object} BoxBounds
 * @property {number} left        Left margin-box coordinate.
 * @property {number} top         Top margin-box coordinate.
 * @property {number} right       Right margin-box coordinate.
 * @property {number} bottom      Bottom margin-box coordinate.
 * @property {Object} [borderBox] Child border-box dimensions.
 */

/**
 * Computes gap rectangles for flex layout.
 *
 * @param {Array<BoxBounds>} boxes                   Array of child margin-box bounds.
 * @param {Object}           config                  Layout configuration.
 * @param {number}           [config.columnGap]      Column gap in pixels.
 * @param {number}           [config.rowGap]         Row gap in pixels.
 * @param {string}           [config.direction]      Flex direction ('row' or 'column').
 * @param {string}           [config.flexWrap]       Flex wrap mode.
 * @param {boolean}          [config.isSpaceBetween] Whether justify-content is space-between.
 * @param {boolean}          [config.isRtl]          Whether direction is RTL.
 * @param {Object}           [config.contentBox]     Container content-box.
 *
 * @return {Array<GapRect>} Gap rectangles.
 */
export function computeFlexGapRects( boxes, config = {} ) {
	if ( ! boxes || boxes.length < 2 ) {
		return [];
	}

	const {
		columnGap = 0,
		rowGap = 0,
		direction = 'row',
		flexWrap = 'nowrap',
		isSpaceBetween = false,
		isRtl = false,
		contentBox,
	} = config;

	if ( columnGap <= 0 && rowGap <= 0 ) {
		return [];
	}

	const isColumn = direction === 'column';
	const isWrap = flexWrap === 'wrap' || flexWrap === 'wrap-reverse';
	const rects = [];

	if ( ! isColumn ) {
		let lines = [];

		if ( ! isWrap ) {
			lines = [
				{
					items: [ ...boxes ],
					bounds: {
						top: Math.min( ...boxes.map( ( b ) => b.top ) ),
						bottom: Math.max( ...boxes.map( ( b ) => b.bottom ) ),
					},
				},
			];
		} else {
			// Sort items vertically by top to group into lines geometrically.
			const sortedByTop = [ ...boxes ].sort( ( a, b ) => a.top - b.top );

			for ( const item of sortedByTop ) {
				let placed = false;
				for ( const line of lines ) {
					const overlap =
						Math.min( line.bounds.bottom, item.bottom ) -
						Math.max( line.bounds.top, item.top );

					if ( overlap > LINE_OVERLAP_THRESHOLD ) {
						line.items.push( item );
						line.bounds.top = Math.min( line.bounds.top, item.top );
						line.bounds.bottom = Math.max(
							line.bounds.bottom,
							item.bottom
						);
						placed = true;
						break;
					}
				}

				if ( ! placed ) {
					lines.push( {
						items: [ item ],
						bounds: { top: item.top, bottom: item.bottom },
					} );
				}
			}

			// Lines are sorted physically from top to bottom.
			lines.sort( ( a, b ) => a.bounds.top - b.bounds.top );
		}

		if ( columnGap > 0 ) {
			for ( const line of lines ) {
				const lineHeight = line.bounds.bottom - line.bounds.top;
				if ( lineHeight < MIN_GAP_SIZE ) {
					continue;
				}

				// Sort items physically from left to right along main axis (invariant to RTL and order).
				line.items.sort( ( a, b ) => a.left - b.left );

				for ( let k = 0; k < line.items.length - 1; k++ ) {
					const itemA = line.items[ k ];
					const itemB = line.items[ k + 1 ];
					const availableSpace = itemB.left - itemA.right;

					if ( availableSpace < MIN_GAP_SIZE ) {
						continue;
					}

					// For space-between in RTL, the nominal gap strip is anchored to the leading item on the right.
					const gapLeft =
						isSpaceBetween && isRtl
							? itemB.left - columnGap
							: itemA.right;
					const width = Math.min( columnGap, availableSpace );

					if ( width >= MIN_GAP_SIZE ) {
						rects.push( {
							type: 'column',
							left: gapLeft,
							top: line.bounds.top,
							width,
							height: lineHeight,
							right: gapLeft + width,
							bottom: line.bounds.bottom,
						} );
					}
				}
			}
		}

		if ( rowGap > 0 && lines.length > 1 ) {
			for ( let L = 0; L < lines.length - 1; L++ ) {
				const lineA = lines[ L ];
				const lineB = lines[ L + 1 ];
				const gapTop = lineA.bounds.bottom;
				const availableHeight = lineB.bounds.top - lineA.bounds.bottom;

				if ( availableHeight < MIN_GAP_SIZE ) {
					continue;
				}

				const height = Math.min( rowGap, availableHeight );
				if ( height >= MIN_GAP_SIZE ) {
					const left = contentBox
						? contentBox.left
						: Math.min( ...boxes.map( ( b ) => b.left ) );
					const width = contentBox
						? contentBox.width
						: Math.max( ...boxes.map( ( b ) => b.right ) ) - left;

					rects.push( {
						type: 'row',
						left,
						top: gapTop,
						width,
						height,
						right: left + width,
						bottom: gapTop + height,
					} );
				}
			}
		}
	} else {
		let lines = [];

		if ( ! isWrap ) {
			lines = [
				{
					items: [ ...boxes ],
					bounds: {
						left: Math.min( ...boxes.map( ( b ) => b.left ) ),
						right: Math.max( ...boxes.map( ( b ) => b.right ) ),
					},
				},
			];
		} else {
			// Sort items horizontally by left to group into vertical column lines.
			const sortedByLeft = [ ...boxes ].sort(
				( a, b ) => a.left - b.left
			);

			for ( const item of sortedByLeft ) {
				let placed = false;
				for ( const line of lines ) {
					const overlap =
						Math.min( line.bounds.right, item.right ) -
						Math.max( line.bounds.left, item.left );

					if ( overlap > LINE_OVERLAP_THRESHOLD ) {
						line.items.push( item );
						line.bounds.left = Math.min(
							line.bounds.left,
							item.left
						);
						line.bounds.right = Math.max(
							line.bounds.right,
							item.right
						);
						placed = true;
						break;
					}
				}

				if ( ! placed ) {
					lines.push( {
						items: [ item ],
						bounds: { left: item.left, right: item.right },
					} );
				}
			}

			// Column lines sorted physically from left to right.
			lines.sort( ( a, b ) => a.bounds.left - b.bounds.left );
		}

		if ( rowGap > 0 ) {
			for ( const line of lines ) {
				const lineWidth = line.bounds.right - line.bounds.left;
				if ( lineWidth < MIN_GAP_SIZE ) {
					continue;
				}

				// Sort items physically from top to bottom along vertical main axis.
				line.items.sort( ( a, b ) => a.top - b.top );

				for ( let k = 0; k < line.items.length - 1; k++ ) {
					const itemA = line.items[ k ];
					const itemB = line.items[ k + 1 ];
					const availableSpace = itemB.top - itemA.bottom;

					if ( availableSpace < MIN_GAP_SIZE ) {
						continue;
					}

					const gapTop = itemA.bottom;
					const height = Math.min( rowGap, availableSpace );

					if ( height >= MIN_GAP_SIZE ) {
						rects.push( {
							type: 'row',
							left: line.bounds.left,
							top: gapTop,
							width: lineWidth,
							height,
							right: line.bounds.right,
							bottom: gapTop + height,
						} );
					}
				}
			}
		}

		if ( columnGap > 0 && lines.length > 1 ) {
			for ( let L = 0; L < lines.length - 1; L++ ) {
				const lineA = lines[ L ];
				const lineB = lines[ L + 1 ];
				const gapLeft = lineA.bounds.right;
				const availableWidth = lineB.bounds.left - lineA.bounds.right;

				if ( availableWidth < MIN_GAP_SIZE ) {
					continue;
				}

				const width = Math.min( columnGap, availableWidth );
				if ( width >= MIN_GAP_SIZE ) {
					const top = contentBox
						? contentBox.top
						: Math.min( ...boxes.map( ( b ) => b.top ) );
					const height = contentBox
						? contentBox.height
						: Math.max( ...boxes.map( ( b ) => b.bottom ) ) - top;

					rects.push( {
						type: 'column',
						left: gapLeft,
						top,
						width,
						height,
						right: gapLeft + width,
						bottom: top + height,
					} );
				}
			}
		}
	}

	return rects;
}
