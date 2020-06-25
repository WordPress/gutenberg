/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { link } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Cell from './cell';
import styles from './styles';

const { placeholderColor } = styles;

export default function LinkCell( { value, onPress } ) {
	return (
		<Cell
			icon={ link }
			label={ __( 'Link to' ) }
			// since this is not actually editable, we treat value as a placeholder
			value={ value || __( 'Add URL' ) }
			valueStyle={ !! value ? undefined : placeholderColor }
			onPress={ onPress }
		/>
	);
}
