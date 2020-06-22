/**
 * WordPress dependencies
 */
import { withPreferredColorScheme } from '@wordpress/compose';
/**
 * Internal dependencies
 */
import Cell from './cell';
import styles from './styles.scss';

function UnsupportedFooterCell( props ) {
	const { ...cellProps } = props;

	return (
		<Cell
			{ ...cellProps }
			editable={ false }
			value={ '' }
			accessibilityRole={ 'text' }
			labelStyle={ styles.unsupportedFooterCell }
		/>
	);
}

export default withPreferredColorScheme( UnsupportedFooterCell );
