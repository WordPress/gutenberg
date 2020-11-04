/**
 * Internal dependencies
 */
import {
	TextTransformEdit,
	useIsTextTransformDisabled,
} from '../../hooks/text-transform';

/**
 * Handles grouping related text decoration and text transform edit components
 * so they can be laid out in a more flexible manner within the Typography
 * InspectorControls panel.
 *
 * @param  {Object}   props Block props to be passed on to individual controls.
 * @return {WPElement}      Component containing text decoration or transform controls.
 */
export default function TextDecorationAndTransformEdit( props ) {
	// Once text decorations block support is added additional checks will
	// need to be added below and it's edit component included.
	const transformAvailable = ! useIsTextTransformDisabled( props );

	if ( ! transformAvailable ) {
		return null;
	}

	return (
		<>
			{ transformAvailable && (
				<div className="block-editor-text-decoration-and-transform">
					{ transformAvailable && <TextTransformEdit { ...props } /> }
				</div>
			) }
		</>
	);
}
