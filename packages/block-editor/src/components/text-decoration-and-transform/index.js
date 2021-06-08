/**
 * Internal dependencies
 */
import {
	TextDecorationEdit,
	useIsTextDecorationDisabled,
} from '../../hooks/text-decoration';
import {
	TextTransformEdit,
	useIsTextTransformDisabled,
} from '../../hooks/text-transform';

/**
 * Handles grouping related text decoration and text transform edit components
 * so they can be laid out in a more flexible manner within the Typography
 * InspectorControls panel.
 *
 * @param {Object} props Block props to be passed on to individual controls.
 *
 * @return {WPElement} Component containing text decoration or transform controls.
 */
export default function TextDecorationAndTransformEdit( props ) {
	const decorationAvailable = ! useIsTextDecorationDisabled( props );
	const transformAvailable = ! useIsTextTransformDisabled( props );

	if ( ! decorationAvailable && ! transformAvailable ) {
		return null;
	}

	return (
		<div className="block-editor-text-decoration-and-transform">
			{ decorationAvailable && <TextDecorationEdit { ...props } /> }
			{ transformAvailable && <TextTransformEdit { ...props } /> }
		</div>
	);
}
