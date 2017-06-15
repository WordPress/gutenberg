/**
 * WordPress dependencies
 */
import { withInstanceId } from 'components';
import { isEmpty } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';

function SelectControl( { label, value, instanceId, onChange, options = [], ...props } ) {
	const id = 'inspector-select-control-' + instanceId;
	const onChangeValue = ( event ) => onChange( event.target.value );
	const selectedValue = value;
	
	return ! isEmpty( options ) && (
		<div className="blocks-select-control">
			<label className="blocks-select-control__label" htmlFor={ id }>{ label }</label>
			<select className="blocks-select-control__input" id={ id } onChange={ onChangeValue } { ...props }>
				{ options.map( ( { value, label } ) =>
					<option key={ value } value={ value } selected={ value == selectedValue }>
						{ label }
					</option>
				) }
			</select>
		</div>
	);
}

export default withInstanceId( SelectControl );
