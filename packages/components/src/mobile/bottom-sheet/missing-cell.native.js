
/**
 * WordPress dependencies
 */
import { withPreferredColorScheme } from '@wordpress/compose';
import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import Cell from './cell';
import styles from './styles.scss';

function BottomSheetMissingCell( props ) {
	const {
		getStylesFromColorScheme,
		onPress,
		...cellProps
	} = props;

	const infoIconStyle = getStylesFromColorScheme( styles.infoIcon, styles.infoIconDark );

	return (
		<Cell
			{ ...cellProps }
			onPress={ onPress }
			editable={ false }
			value={ '' }
		>
			<Icon
				label={ __( 'Help icon' ) }
				icon="editor-help"
				color={ infoIconStyle.color }
				size={ 24 }
			/>
		</Cell>
	);
}

export default withPreferredColorScheme( BottomSheetMissingCell );
