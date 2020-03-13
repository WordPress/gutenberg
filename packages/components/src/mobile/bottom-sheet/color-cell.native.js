/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Icon, chevronRight } from '@wordpress/icons';
import { ColorIndicator } from '@wordpress/components';
/**
 * Internal dependencies
 */
import { __experimentalUseGradient } from '@wordpress/block-editor';
import Cell from './cell';
import styles from './styles.scss';

export default function BottomSheetColorCell( props ) {
	const { onPress, color, clientId, ...cellProps } = props;

	const { gradientValue } = __experimentalUseGradient( {}, clientId );
	const isGradient = gradientValue && ! color;

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
			<ColorIndicator
				color={ isGradient ? gradientValue : color }
				style={ styles.colorCircle }
				gradient={ isGradient }
			/>
			<Icon icon={ chevronRight }></Icon>
		</Cell>
	);
}
