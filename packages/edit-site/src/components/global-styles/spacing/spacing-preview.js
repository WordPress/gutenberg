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
function SpacingPreview( { spacingSize } ) {
	// Handle fluid spacing values
	const spacingValue = spacingSize?.size || '1rem';

	// Parse CSS comparison functions (clamp, min, max)
	const { displayValue, previewValue } = parseComparisonValue( spacingValue );

	const hasFluidObject =
		spacingSize?.fluid &&
		typeof spacingSize.fluid === 'object' &&
		spacingSize.fluid.min &&
		spacingSize.fluid.preferred &&
		spacingSize.fluid.max;

	let boxSize = previewValue;
	let label = displayValue;
	if ( hasFluidObject ) {
		const { min, preferred, max } = spacingSize.fluid;
		const preferredValue = preferred || spacingSize.size || '1rem';
		boxSize = preferredValue;
		label = `${ min } → ${ max }`;
	}

	return (
		<div className="edit-site-spacing-preview">
			<div
				className="edit-site-spacing-preview__box"
				style={ { width: boxSize, height: boxSize } }
			/>
			<div className="edit-site-spacing-preview__value">{ label }</div>
		</div>
	);
}

export default SpacingPreview;
