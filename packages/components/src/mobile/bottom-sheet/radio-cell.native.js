/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Icon, check } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import Cell from './cell';

export default function BottomSheetColorCell( props ) {
	const { selected, ...cellProps } = props;

	return (
		<Cell
			{ ...cellProps }
			accessibilityRole={ 'button' }
			accessibilityHint={
				/* translators: accessibility text (hint for selecting option) */
				__( 'Double tap to select the option' )
			}
			editable={ false }
			value={ '' }
		>
			{ selected && <Icon icon={ check }></Icon> }
		</Cell>
	);
}
