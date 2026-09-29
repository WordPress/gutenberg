import temml from 'temml';

/**
 * Options for LaTeX to MathML conversion.
 */
export interface LatexToMathMLOptions {
	/**
	 * Whether to render in display mode (block) or inline mode.
	 * @default true
	 */
	displayMode?: boolean;
}

/**
 * Converts LaTeX math syntax to MathML.
 *
 * @param latex               - The LaTeX string to convert.
 * @param options             - Conversion options.
 * @param options.displayMode
 * @return The MathML string.
 * @throws Will throw an error if the LaTeX is invalid.
 *
 * @example
 * ```js
 * import latexToMathML from '@wordpress/latex-to-mathml';
 *
 * const mathML = latexToMathML( 'x^2', { displayMode: false } );
 * ```
 */
export default function latexToMathML(
	latex: string,
	{ displayMode = true }: LatexToMathMLOptions = {}
): string {
	const mathML = temml.renderToString( latex, {
		displayMode,
		annotate: true,
		throwOnError: true,
	} );
	const doc = document.implementation.createHTMLDocument( '' );
	doc.body.innerHTML = mathML;
	const math = doc.body.querySelector( 'math' );
	if ( ! math ) {
		return '';
	}

	// temml marks the cells of `aligned`, `cases` and tagged equations with
	// classes for its own stylesheet. Write the MathML `columnalign`
	// attribute on the cell instead, so the alignment is part of the content:
	// Firefox and Safari honor it natively, and the polyfill in `style.scss`
	// covers Chromium, which implements MathML Core only.
	for ( const cell of math.querySelectorAll(
		'mtd.tml-right, mtd.tml-left'
	) ) {
		cell.setAttribute(
			'columnalign',
			cell.classList.contains( 'tml-right' ) ? 'right' : 'left'
		);
	}

	// The remaining classes are hooks for temml's stylesheet, which is not
	// used. Drop them so the content is plain MathML and does not depend on
	// the class names of a temml version.
	for ( const element of math.querySelectorAll( '[class]' ) ) {
		element.removeAttribute( 'class' );
	}

	for ( const table of math.querySelectorAll( 'mtable' ) ) {
		writeColumnSpacing( table );
	}

	return math.innerHTML;
}

/**
 * The number and unit of a CSS length, or `null` for anything else.
 *
 * @param value The declared value, possibly empty.
 * @return The parsed length.
 */
function parseLength( value: string ): { number: number; unit: string } | null {
	const match = value.trim().match( /^(-?\d*\.?\d+)([a-z%]*)$/ );
	if ( ! match ) {
		return null;
	}
	return { number: parseFloat( match[ 1 ] ), unit: match[ 2 ] };
}

/**
 * The declarations of a `style` attribute, with the `padding` shorthand
 * expanded. Read from the attribute rather than through `element.style`,
 * which MathML elements lack in a DOM without `MathMLElement`.
 *
 * @param element The element.
 * @return The declarations by property.
 */
function getDeclarations( element: Element ): Map< string, string > {
	const declarations = new Map< string, string >();
	for ( const declaration of ( element.getAttribute( 'style' ) ?? '' ).split(
		';'
	) ) {
		const [ property, ...rest ] = declaration.split( ':' );
		const value = rest.join( ':' ).trim();
		if ( ! value ) {
			continue;
		}
		if ( property.trim() === 'padding' ) {
			const [ top, right = top, bottom = top, left = right ] =
				value.split( /\s+/ );
			declarations.set( 'padding-top', top );
			declarations.set( 'padding-right', right );
			declarations.set( 'padding-bottom', bottom );
			declarations.set( 'padding-left', left );
		} else {
			declarations.set( property.trim(), value );
		}
	}
	return declarations;
}

/**
 * Writes declarations back as the `style` attribute, or removes it when there
 * are none left.
 *
 * @param element      The element.
 * @param declarations The declarations by property.
 */
function setDeclarations(
	element: Element,
	declarations: Map< string, string >
) {
	if ( declarations.size === 0 ) {
		element.removeAttribute( 'style' );
		return;
	}
	element.setAttribute(
		'style',
		Array.from(
			declarations,
			( [ property, value ] ) => `${ property }:${ value }`
		).join( ';' )
	);
}

const MATHML = 'http://www.w3.org/1998/Math/MathML';

/**
 * Moves the space between the columns of a table from the cells to the table.
 *
 * temml spaces the columns with `padding` on each cell, as MathML Core has no
 * attribute for it, and gives the outer sides none. MathML's own attribute for
 * the space between columns is `columnspacing` on the table: Firefox honors
 * it, and the polyfill in `common.scss` reads it for the engines that do not.
 * Where temml spaces the columns unevenly, the pairs of `aligned`, the table
 * gets the smallest space and the rest goes into the cells as `mspace`, the
 * glue TeX itself puts there. So the spacing is part of the content rather
 * than a `style` attribute, which `wp_kses` does not allow every author.
 *
 * @param table The `mtable`.
 */
function writeColumnSpacing( table: Element ) {
	const rows = Array.from( table.children ).filter(
		( child ) => child.localName === 'mtr'
	);
	const cellsOf = ( row: Element ) =>
		Array.from( row.children ).filter(
			( child ) => child.localName === 'mtd'
		);
	// A row may be short; the widest one has every column.
	const cells = rows.reduce< Element[] >( ( widest, row ) => {
		const rowCells = cellsOf( row );
		return rowCells.length > widest.length ? rowCells : widest;
	}, [] );

	if ( cells.length === 0 ) {
		return;
	}

	// A side without a declaration keeps the engine's default cell padding,
	// which temml relies on between the columns of a matrix. Chromium's is
	// 0.4em, and Firefox's default `columnspacing` of 0.8em amounts to the
	// same.
	const side = ( cell: Element, property: string ) =>
		parseLength( getDeclarations( cell ).get( property ) ?? '0.4em' );
	const spacing: number[] = [];
	let unit = '';

	for ( let i = 0; i < cells.length - 1; i++ ) {
		const right = side( cells[ i ], 'padding-right' );
		const left = side( cells[ i + 1 ], 'padding-left' );
		if ( ! right || ! left ) {
			return;
		}
		// A zero has no unit; the other side decides. Mixed units cannot be
		// added, so the padding stays as it is.
		for ( const length of [ right, left ] ) {
			if ( length.number !== 0 && length.unit ) {
				if ( unit && unit !== length.unit ) {
					return;
				}
				unit = length.unit;
			}
		}
		spacing.push( right.number + left.number );
	}

	unit ||= 'em';
	const length = ( number: number ) =>
		parseFloat( number.toFixed( 4 ) ) + unit;
	// A single column has no space between columns, only sides without any.
	const smallest = spacing.length ? Math.min( ...spacing ) : 0;

	// Extra space ahead of a column is glue at the start of its cells, which
	// only reads right for cells aligned to a side.
	const glue = spacing.map( ( space ) => space - smallest );
	if (
		glue.some(
			( extra, i ) =>
				extra > 0 &&
				rows.some( ( row ) => {
					const cell = cellsOf( row )[ i + 1 ];
					return (
						cell &&
						! [ 'left', 'right' ].includes(
							cell.getAttribute( 'columnalign' ) ?? ''
						)
					);
				} )
		)
	) {
		return;
	}

	table.setAttribute( 'columnspacing', length( smallest ) );

	for ( const row of rows ) {
		cellsOf( row ).forEach( ( cell, i ) => {
			const declarations = getDeclarations( cell );
			declarations.delete( 'padding-left' );
			declarations.delete( 'padding-right' );
			setDeclarations( cell, declarations );
			if ( i > 0 && glue[ i - 1 ] > 0 ) {
				const space = cell.ownerDocument.createElementNS(
					MATHML,
					'mspace'
				);
				space.setAttribute( 'width', length( glue[ i - 1 ] ) );
				cell.prepend( space );
			}
		} );
	}
}
