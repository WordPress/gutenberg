/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { RichText } from '../';
import { BlockNavigationBlockFill } from './block-slot';

export default function BlockNavigationEditor( { value, onChange } ) {
	return (
		<BlockNavigationBlockFill>
			<RichText
				value={ value }
				onChange={ onChange }
				placeholder={ __( 'Navigation item' ) }
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
