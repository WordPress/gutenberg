/**
 * WordPress dependencies
 */
import { ToolbarGroup, ToolbarItem } from '@wordpress/components';
import { Icon, crop } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockControls from '../block-controls';
import Cropper from './cropper';
import ZoomDropdown from './zoom-dropdown';
import AspectRatioDropdown from './aspect-ratio-dropdown';
import RotationButton from './rotation-button';
import FormControls from './form-controls';

export default function ImageEditor( {
	url,
	width,
	height,
	clientWidth,
	naturalHeight,
	naturalWidth,
} ) {
	return (
		<>
			<Cropper
				url={ url }
				width={ width }
				height={ height }
				clientWidth={ clientWidth }
				naturalHeight={ naturalHeight }
				naturalWidth={ naturalWidth }
			/>
			<BlockControls group="alt">
				<div className="image-editor__crop-toolbar-icon">
					<Icon icon={ crop } label={ __( 'Crop' ) } />
				</div>
				<ToolbarGroup>
					<ZoomDropdown />
					<ToolbarItem>
						{ ( toggleProps ) => (
							<AspectRatioDropdown toggleProps={ toggleProps } />
						) }
					</ToolbarItem>
					<RotationButton />
				</ToolbarGroup>
				<ToolbarGroup>
					<FormControls />
				</ToolbarGroup>
			</BlockControls>
		</>
	);
}

export { default as ImageEditingProvider } from './context';
