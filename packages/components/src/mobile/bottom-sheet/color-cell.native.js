/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Icon, chevronRight } from '@wordpress/icons';
import { ColorIndicator } from '@wordpress/components';
/**
 * Internal dependencies
 */
import Cell from './cell';
import styles from './styles.scss';

export default function BottomSheetColorCell( props ) {
	const { onPress, color, ...cellProps } = props;

	return (
		<Cell
			{ ...cellProps }
			accessibilityRole={ 'none' }
			accessibilityHint={
				/* translators: accessibility text (hint for switches) */
				__( 'Double tap to go to color settings' )
			}
			onPress={ onPress }
			editable={ false }
			value={ ! color && 'Default' }
		>
			{ color && (
				<ColorIndicator color={ color } style={ styles.colorCircle } />
			) }
			<Icon icon={ chevronRight }></Icon>
		</Cell>
	);
}
