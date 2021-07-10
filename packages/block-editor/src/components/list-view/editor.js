/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { RichText } from '../';
import { ListViewBlockFill } from './block-slot';

export default function ListViewEditor( { value, onChange } ) {
	return (
		<ListViewBlockFill>
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
		</ListViewBlockFill>
	);
}
