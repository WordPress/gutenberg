/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { link, Icon, chevronRight } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Cell from './cell';
import styles from './styles.scss';

const { placeholderColor } = styles;

export default function LinkCell( {
	value,
	valueMask,
	onPress,
	showIcon = true,
} ) {
	return (
		<Cell
			icon={ showIcon && link }
			label={ __( 'Link to' ) }
			// since this is not actually editable, we treat value as a placeholder
			value={ valueMask || value || __( 'Search or type URL' ) }
			valueStyle={
				!! ( value || valueMask ) ? undefined : placeholderColor
			}
			onPress={ onPress }
		>
			<Icon icon={ chevronRight }></Icon>
		</Cell>
	);
}
