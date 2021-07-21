/**
 * WordPress dependencies
 */
import { RangeControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const DEFAULT_COLUMNS = 1;
const MIN_COLUMNS = 1;
const MAX_COLUMNS = 5;

/**
 * Control to set CSS columns count.
 *
 * @param {Object}   props          Component props.
 * @param {string}   props.value    Currently selected column count.
 * @param {Function} props.onChange Handles change in column count selection.
 *
 * @return {WPElement} Column count control.
 */
export default function ColumnCountControl( { value, onChange } ) {
	return (
		<RangeControl
			allowReset={ true }
			initialPosition={ DEFAULT_COLUMNS }
			label={ __( 'Text columns' ) }
			max={ MAX_COLUMNS }
			min={ MIN_COLUMNS }
			onChange={ onChange }
			value={ value }
		/>
	);
}
