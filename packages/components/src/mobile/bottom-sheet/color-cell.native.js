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
import LinearGradient from '../linear-gradient';
import { __experimentalUseGradient } from '@wordpress/block-editor';
/**
 * Internal dependencies
 */
import Cell from './cell';
import styles from './styles.scss';

export default function BottomSheetColorCell( props ) {
	const { onPress, color, clientId, ...cellProps } = props;

	const { gradientValue } = __experimentalUseGradient( {}, clientId );

	function getCircleSwatch() {
		if ( gradientValue && ! color ) {
			return (
				<LinearGradient
					gradientValue={ gradientValue }
					style={ styles.colorCircle }
				/>
			);
		}
		return (
			<View
				style={ [ styles.colorCircle, { backgroundColor: color } ] }
			/>
		);
	}

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
			{ getCircleSwatch() }
			<Icon icon={ chevronRight }></Icon>
		</Cell>
	);
}
