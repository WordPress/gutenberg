/**
 * WordPress dependencies
 */
import { SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { __unstableGetValuesFromColors as getValuesFromColors } from './index';

/**
 * SVG and stylesheet needed for rendering the duotone filter.
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
 * Stylesheet for disabling a global styles duotone filter.
 *
 * @param {Object} props          Duotone props.
 * @param {string} props.selector Selector to disable the filter for.
 *
 * @return {WPElement} Filter none style element.
 */
export function DuotoneUnsetStylesheet( { selector } ) {
	const css = `
${ selector } {
	filter: none;
}
`;
	return <style>{ css }</style>;
}

/**
 * The SVG part of the duotone filter.
 *
 * @param {Object}   props        Duotone props.
 * @param {string}   props.id     Unique id for this duotone filter.
 * @param {string[]} props.colors Color strings from dark to light.
 *
 * @return {WPElement} Duotone SVG.
 */
export function DuotoneFilter( { id, colors } ) {
	const values = getValuesFromColors( colors );
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
 * SVG from a duotone preset
 *
 * @param {Object} props        Duotone props.
 * @param {Object} props.preset Duotone preset settings.
 *
 * @return {WPElement} Duotone element.
 */
export function PresetDuotoneFilter( { preset } ) {
	return (
		<DuotoneFilter
			id={ `wp-duotone-${ preset.slug }` }
			colors={ preset.colors }
		/>
	);
}
