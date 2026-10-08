/**
 * The three lines of a rectangle that are compared on each axis. Vertical
 * guides compare left, horizontal centre and right; horizontal guides
 * compare top, vertical centre and bottom.
 */
const AXES = {
	vertical: {
		getLines: ( rect ) => [
			rect.left,
			( rect.left + rect.right ) / 2,
			rect.right,
		],
		getStart: ( rect ) => rect.top,
		getEnd: ( rect ) => rect.bottom,
	},
	horizontal: {
		getLines: ( rect ) => [
			rect.top,
			( rect.top + rect.bottom ) / 2,
			rect.bottom,
		],
		getStart: ( rect ) => rect.left,
		getEnd: ( rect ) => rect.right,
	},
};

const CENTRE_LINE_INDEX = 1;

function getGapAlongAxis( axis, a, b ) {
	const { getStart, getEnd } = AXES[ axis ];
	return Math.max(
		0,
		getStart( b ) - getEnd( a ),
		getStart( a ) - getEnd( b )
	);
}

/**
 * Works out which alignment guides to draw while a block is dragged over a
 * grid. A guide is drawn when one of the landing area's edges or centres lines
 * up with the same kind of line on the container or on another block.
 *
 * For each line of the landing area, only the nearest matching block gets a
 * guide, so a grid where everything shares the same tracks doesn't fill up
 * with lines. Every container match gets a guide.
 *
 * All rectangles are `{ left, top, right, bottom }` in pixels, in the same
 * coordinate space.
 *
 * @param {Object}   options
 * @param {Object}   options.target    The area the dragged block would land in.
 * @param {Object[]} options.siblings  The other blocks in the grid.
 * @param {Object}   options.container The grid's content area.
 * @param {number}   options.tolerance How close two lines must be to match, in pixels.
 *
 * @return {Array<{orientation: string, position: number, start: number, end: number, kind: string}>}
 * Guide segments. `orientation` is `vertical` or `horizontal`, `position` is
 * where the line sits on the other axis, `start` and `end` are its extent, and
 * `kind` is `sibling`, `container-edge` or `container-centre`.
 */
export function getAlignmentGuides( {
	target,
	siblings = [],
	container,
	tolerance = 1,
} ) {
	const guides = [];
	const isMatch = ( a, b ) => Math.abs( a - b ) <= tolerance;

	for ( const [ orientation, axis ] of Object.entries( AXES ) ) {
		const targetLines = axis.getLines( target );

		if ( container ) {
			axis.getLines( container ).forEach( ( containerLine, index ) => {
				if (
					targetLines.some( ( targetLine ) =>
						isMatch( targetLine, containerLine )
					)
				) {
					guides.push( {
						orientation,
						position: containerLine,
						start: axis.getStart( container ),
						end: axis.getEnd( container ),
						kind:
							index === CENTRE_LINE_INDEX
								? 'container-centre'
								: 'container-edge',
					} );
				}
			} );
		}

		for ( const targetLine of targetLines ) {
			let nearest = null;
			for ( const sibling of siblings ) {
				const siblingLine = axis
					.getLines( sibling )
					.find( ( line ) => isMatch( targetLine, line ) );
				if ( siblingLine === undefined ) {
					continue;
				}
				const gap = getGapAlongAxis( orientation, target, sibling );
				if ( ! nearest || gap < nearest.gap ) {
					nearest = { sibling, line: siblingLine, gap };
				}
			}
			if ( nearest ) {
				guides.push( {
					orientation,
					position: nearest.line,
					start: Math.min(
						axis.getStart( target ),
						axis.getStart( nearest.sibling )
					),
					end: Math.max(
						axis.getEnd( target ),
						axis.getEnd( nearest.sibling )
					),
					kind: 'sibling',
				} );
			}
		}
	}

	return guides;
}
