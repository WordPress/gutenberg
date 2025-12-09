/**
 * WordPress dependencies
 */
import type { SpacingSize } from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import { parseComparisonValue } from './utils';

/**
 * Renders a preview of a spacing size with visual representation.
 *
 * @param {Object} props             Component props.
 * @param {Object} props.spacingSize The spacing size object.
 * @return {Element} The spacing preview component.
 */
interface SpacingPreviewProps {
	spacingSize: SpacingSize;
}

function SpacingPreview( { spacingSize }: SpacingPreviewProps ) {
	// Handle fluid spacing values
	const spacingValue = spacingSize?.size || '1rem';

	// Parse CSS comparison functions (clamp, min, max)
	const { displayValue, previewValue } = parseComparisonValue(
		String( spacingValue ) as string | undefined
	);

	const hasFluidObject =
		spacingSize?.fluid &&
		typeof spacingSize.fluid === 'object' &&
		spacingSize.fluid.min &&
		spacingSize.fluid.preferred &&
		spacingSize.fluid.max;

	let boxSize = previewValue;
	let label = displayValue;
	if ( hasFluidObject ) {
		// @ts-ignore
		const { min, preferred, max } = spacingSize.fluid;
		const preferredValue = preferred || spacingSize.size || '1rem';
		boxSize = preferredValue;
		label = `${ min } → ${ max }`;
	}

	return (
		<div className="global-styles-ui-spacing-preview">
			<div
				className="global-styles-ui-spacing-preview__box"
				style={ { width: boxSize, height: boxSize } }
			/>
			<div className="global-styles-ui-spacing-preview__value">{ label }</div>
		</div>
	);
}

export default SpacingPreview;
