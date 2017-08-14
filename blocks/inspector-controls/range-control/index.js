/**
 * WordPress dependencies
 */
import { Dashicon, withInstanceId } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BaseControl from './../base-control';
import './style.scss';

function RangeControl( { label, value, instanceId, onChange, beforeIcon, afterIcon, ...props } ) {
	const id = 'inspector-range-control-' + instanceId;
	const onChangeValue = ( event ) => onChange( Number( event.target.value ) );

	return (
		<BaseControl label={ label } id={ id } className="blocks-range-control">
			{ beforeIcon && <Dashicon icon={ beforeIcon } size={ 20 } /> }
			<input
				className="blocks-range-control__slider"
				id={ id }
				type="range"
				value={ value }
				onChange={ onChangeValue }
				{ ...props } />
			{ afterIcon && <Dashicon icon={ afterIcon } /> }
			<input
				className="blocks-range-control__number"
				type="number"
				onChange={ onChangeValue }
				value={ value }
				{ ...props }
			/>
		</BaseControl>
	);
}

export default withInstanceId( RangeControl );
