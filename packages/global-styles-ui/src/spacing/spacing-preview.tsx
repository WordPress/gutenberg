import type { SpacingSize } from '@wordpress/global-styles-engine';
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

	const fluid = spacingSize?.fluid;
	const hasFluidObject =
		!! fluid &&
		typeof fluid === 'object' &&
		!! fluid.min &&
		!! fluid.preferred &&
		!! fluid.max;

	let boxSize = previewValue;
	let label = displayValue;
	if ( hasFluidObject && typeof fluid === 'object' ) {
		const { min, preferred, max } = fluid;
		boxSize = String( preferred || spacingSize.size || '1rem' );
		label = `${ min } → ${ max }`;
	}

	return (
		<div className="global-styles-ui-spacing-preview">
			<div
				className="global-styles-ui-spacing-preview__box"
				style={ { width: boxSize, height: boxSize } }
			/>
			<div className="global-styles-ui-spacing-preview__value">
				{ label }
			</div>
		</div>
	);
}

export default SpacingPreview;
