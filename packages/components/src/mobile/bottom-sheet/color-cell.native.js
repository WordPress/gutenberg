/**
 * External dependencies
 */
import { View } from 'react-native';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Icon, chevronRight } from '@wordpress/icons';

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
			value={ '' }
		>
			<View
				style={ [ styles.colorCircle, { backgroundColor: color } ] }
			/>
			<Icon icon={ chevronRight }></Icon>
		</Cell>
	);
}
