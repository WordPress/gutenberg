/**
 * WordPress dependencies
 */
import { withPreferredColorScheme } from '@wordpress/compose';
/**
 * Internal dependencies
 */
import Cell from './cell';
import styles from './styles';

function FooterMessageCell( props ) {
	return (
		<Cell
			{ ...props }
			editable={ false }
			value={ '' }
			accessibilityRole={ 'text' }
			labelStyle={ styles.unsupportedFooterCell }
		/>
	);
}

export default withPreferredColorScheme( FooterMessageCell );
