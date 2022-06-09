/**
 * WordPress dependencies
 */
import { SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { __unstableGetValuesFromColors as getValuesFromColors } from './index';


/**
 * Stylesheet for rendering the duotone filter.
 *
 * @param {Object} props          Duotone props.
 * @param {string} props.selector Selector to apply the filter to.
 * @param {string} props.id       Unique id for this duotone filter.
 *
 * @return {WPElement} Duotone element.
 */
export function DuotoneStylesheet( { selector, id } ) {
	const css = `
${ selector } {
	filter: url( #${ id } );
}
`;
	return <style>{ css }</style>;
}

/**
 * Values for the SVG `feComponentTransfer`.
 *
 * @typedef Values {Object}
 * @property {number[]} r Red values.
 * @property {number[]} g Green values.
 * @property {number[]} b Blue values.
 * @property {number[]} a Alpha values.
 */

/**
 * SVG for rendering the duotone filter.
 *
 * @param {Object} props        Duotone props.
 * @param {string} props.id     Unique id for this duotone filter.
 * @param {Values} props.values R, G, B, and A values to filter with.
 *
 * @return {WPElement} Duotone element.
 */
export function DuotoneFilter( { id, values } ) {
	return (
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
				<filter id={ id }>
					<feColorMatrix
						// Use sRGB instead of linearRGB so transparency looks correct.
						colorInterpolationFilters="sRGB"
						type="matrix"
						// Use perceptual brightness to convert to grayscale.
						values="
							.299 .587 .114 0 0
							.299 .587 .114 0 0
							.299 .587 .114 0 0
							.299 .587 .114 0 0
						"
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
						<feFuncA
							type="table"
							tableValues={ values.a.join( ' ' ) }
						/>
					</feComponentTransfer>
					<feComposite
						// Re-mask the image with the original transparency since the feColorMatrix above loses that information.
						in2="SourceGraphic"
						operator="in"
					/>
				</filter>
			</defs>
		</SVG>
	);
}

/**
 * SVG filter from on a duotone preset.
 *
 * @param {Object} props          Preset props.
 * @param {Object} props.preset   Duotone preset.
 *
 * @return {WPElement} Duotone element.
 */
export function PresetDuotoneFilter( { preset } ) {
	return (
		<DuotoneFilter
			id={ `wp-duotone-${ preset.slug }` }
			values={ getValuesFromColors( preset.colors ) }
		/>
	);
}
