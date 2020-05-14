/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { RichText } from '../';
import { BlockNavigationBlockFill } from './block-contents';

export default function BlockNavigationEditor( { value, onChange } ) {
	return (
		<BlockNavigationBlockFill>
			<RichText
				className="wp-block-navigation-link__label"
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
