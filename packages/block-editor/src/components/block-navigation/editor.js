/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { __experimentalTreeGridItem as TreeGridItem } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { RichText } from '../';
import { BlockNavigationBlockFill } from './block-slot';

export default function BlockNavigationEditor( { value, onChange } ) {
	return (
		<BlockNavigationBlockFill>
			<TreeGridItem
				as={ RichText }
				value={ value }
				onChange={ onChange }
				placeholder={ __( 'Navigation item' ) }
				keepPlaceholderOnFocus
				withoutInteractiveFormatting
				allowedFormats={ [
					'core/bold',
					'core/italic',
					'core/image',
					'core/strikethrough',
				] }
			/>
		</BlockNavigationBlockFill>
	);
}
