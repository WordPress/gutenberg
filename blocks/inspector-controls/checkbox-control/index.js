/**
 * WordPress dependencies
 */
import { withInstanceId } from 'components';

/**
 * Internal dependencies
 */
import './style.scss';

function CheckboxControl( { label, heading, checked, instanceId, onChange, ...props } ) {
	const id = 'inspector-checkbox-control-' + instanceId;
	const onChangeValue = ( event ) => onChange( event.target.value );

	return (
		<div className="blocks-checkbox-control">
			{ heading && <span className="blocks-checkbox-control__heading">{ heading }</span> }
			<label className="blocks-checkbox-control__label" htmlFor={ id }>
				<input
					id={ id }
					className="blocks-checkbox-control__input" 
					type="checkbox"
					value="1"
					onChange= { onChangeValue }
					checked={ checked }
					{ ...props } />
				{ label }
			</label>
		</div>
	);
}

export default withInstanceId( CheckboxControl );
