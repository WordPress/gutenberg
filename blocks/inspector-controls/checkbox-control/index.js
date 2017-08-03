/**
 * WordPress dependencies
 */
import { withInstanceId } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BaseControl from './../base-control';
import './style.scss';

function CheckboxControl( { label, heading, checked, instanceId, onChange, ...props } ) {
	const id = 'inspector-checkbox-control-' + instanceId;
	const onChangeValue = ( event ) => onChange( event.target.value );

	return (
		<BaseControl label={ heading } id={ id }>
			<input
				id={ id }
				className="blocks-checkbox-control__input"
				type="checkbox"
				value="1"
				onChange={ onChangeValue }
				checked={ checked }
				{ ...props }
			/>
			<label className="blocks-checkbox-control__label" htmlFor={ id }>
				{ label }
			</label>
		</BaseControl>
	);
}

export default withInstanceId( CheckboxControl );
