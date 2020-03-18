/**
 * External dependencies
 */
import useResizeAware from 'react-resize-aware';

/**
 * WordPress dependencies
 */
import { Disabled } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockList from '../block-list';

function AutoBlockPreview( { viewportWidth } ) {
	const [
		containerResizeListener,
		{ width: containerWidth },
	] = useResizeAware();
	const [
		containtResizeListener,
		{ height: contentHeight },
	] = useResizeAware();

	return (
		<div
			className="block-editor-block-preview__container editor-styles-wrapper is-auto-height"
			aria-hidden
			style={ {
				height: ( contentHeight * containerWidth ) / viewportWidth,
			} }
		>
			{ containerResizeListener }
			<Disabled
				style={ {
					transform: `scale(${ containerWidth / viewportWidth })`,
					width: viewportWidth,
				} }
				className="block-editor-block-preview__content"
			>
				{ containtResizeListener }
				<BlockList />
			</Disabled>
		</div>
	);
}

export default AutoBlockPreview;
