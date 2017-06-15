/**
 * WordPress dependencies
 */
import { withInstanceId } from 'components';
import { isEmpty } from 'lodash';

/**
 * Internal dependencies
 */
import BaseControl from './../base-control';
import './style.scss';

function SelectControl( { label, selected, instanceId, onChange, options = [], ...props } ) {
	const id = 'inspector-select-control-' + instanceId;
	const onChangeValue = ( event ) => onChange( event.target.value );
	
	return ! isEmpty( options ) && (
		<BaseControl type="select" label={ label } id={ id }>
			<select className="blocks-select-control__input" id={ id } onChange={ onChangeValue } { ...props }>
				{ options.map( ( { value, label } ) =>
					<option key={ value } value={ value } selected={ value == selected }>
						{ label }
					</option>
				) }
			</select>
		</BaseControl>
	);
}

export default withInstanceId( SelectControl );
