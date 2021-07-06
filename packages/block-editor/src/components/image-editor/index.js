/**
 * WordPress dependencies
 */
import { ToolbarGroup, ToolbarItem } from '@wordpress/components';

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
			<BlockControls>
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
