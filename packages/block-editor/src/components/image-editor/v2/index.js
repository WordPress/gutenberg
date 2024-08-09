/**
 * WordPress dependencies
 */
import {
	ToolbarGroup,
	ToolbarItem,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import AspectRatioDropdown from './aspect-ratio-dropdown';
import BlockControls from '../../block-controls';
import RotationButton from './rotation-button';
import FormControls from './form-controls';
import { unlock } from '../../../lock-unlock';

const { ImageCropper } = unlock( componentsPrivateApis );

export default function ImageEditor( {
	src,
	width,
	height,
	onCrop,
	onCancel,
} ) {
	return (
		<ImageCropper.Provider src={ src } width={ width } height={ height }>
			<ImageCropper />

			<BlockControls>
				<ToolbarGroup>
					<ToolbarItem>
						{ ( toggleProps ) => (
							<AspectRatioDropdown toggleProps={ toggleProps } />
						) }
					</ToolbarItem>
					<RotationButton />
				</ToolbarGroup>
				<ToolbarGroup>
					<FormControls onCrop={ onCrop } onCancel={ onCancel } />
				</ToolbarGroup>
			</BlockControls>
		</ImageCropper.Provider>
	);
}
