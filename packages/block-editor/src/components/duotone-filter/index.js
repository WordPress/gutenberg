/**
 * WordPress dependencies
 */
import { SVG } from '@wordpress/components';

/**
 * CSS selectors to apply the filter to.
 * - `true` to select the whole scope/block.
 * - String for a single selector.
 * - Array of strings for a multiple selectors.
 *
 * @typedef Selectors {boolean|string|string[]}
 */

/**
 * Values for the SVG `feComponentTransfer`.
 *
 * @typedef Values {Object}
 * @property {number[]} r Red values.
 * @property {number[]} g Green values.
 * @property {number[]} b Blue values.
 */

/**
 * SVG and stylesheet needed for rendering the duotone filter.
 *
 * @param  {Object}    props           Duotone props.
 * @param  {string}    props.slug      Unique id for this duotone filter.
 * @param  {Selectors} props.selectors Selectors to apply the filter to.
 * @param  {Values}    props.values    R, G, and B values to filter with.
 * @return {WPElement}                 Duotone element.
 */
export default function DuotoneFilter( { slug, selectors, values } ) {
	const duotoneId = `duotone-filter-${ slug }`;

	// boolean | string | string[] -> boolean[] | string[]
	const selectorsArray = Array.isArray( selectors )
		? selectors
		: [ selectors ];

	// boolean[] | string[] -> string[]
	const scopedSelectors = selectorsArray.map( ( selector ) =>
		typeof selector === 'string'
			? `.${ duotoneId } ${ selector }`
			: `.${ duotoneId }`
	);

	// string[] -> string
	const selector = scopedSelectors.join( ', ' );

	const stylesheet = `
${ selector } {
	filter: url( #${ duotoneId } );
}
`;

	return (
		<>
			<SVG
				xmlnsXlink="http://www.w3.org/1999/xlink"
				viewBox="0 0 0 0"
				width="0"
				height="0"
				focusable="false"
				role="none"
				style={ {
					visibility: 'hidden',
					position: 'absolute',
					left: '-9999px',
					overflow: 'hidden',
				} }
			>
				<defs>
					<filter id={ duotoneId }>
						<feColorMatrix
							type="matrix"
							// Use perceptual brightness to convert to grayscale.
							// prettier-ignore
							values=".299 .587 .114 0 0
							        .299 .587 .114 0 0
							        .299 .587 .114 0 0
							        0 0 0 1 0"
						/>
						<feComponentTransfer
							// Use sRGB instead of linearRGB to be consistent with how CSS gradients work.
							colorInterpolationFilters="sRGB"
						>
							<feFuncR
								type="table"
								tableValues={ values.r.join( ' ' ) }
							/>
							<feFuncG
								type="table"
								tableValues={ values.g.join( ' ' ) }
							/>
							<feFuncB
								type="table"
								tableValues={ values.b.join( ' ' ) }
							/>
						</feComponentTransfer>
					</filter>
				</defs>
			</SVG>
			<style dangerouslySetInnerHTML={ { __html: stylesheet } } />
		</>
	);
}
