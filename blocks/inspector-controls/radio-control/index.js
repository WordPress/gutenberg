/**
 * WordPress dependencies
 */
import { withInstanceId } from 'components';
import { isEmpty } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';

function RadioControl( { label, selected, instanceId, options = [] } ) {
	const id = 'inspector-radio-control-' + instanceId;
	const onChangeValue = ( event ) => onChange( event.target.value );
	
	return ! isEmpty( options ) && (
		<div className="blocks-radio-control">
			<label className="blocks-radio-control__label">{ label }</label>
			<div className="blocks-radio-control__inputs">
				{ options.map( ( { value, label }, index ) =>
					<label htmlFor={ ( id + '-' + index ) }>
						<input
							id={ ( id + '-' + index ) }
							className="blocks-radio-control__input"
							type="radio"
							name={ id }
							value={ value }
							onChange={ onChangeValue }
							selected={ value == selected }
						/>
						{ label }
					</label>
				) }
			</div>
		</div>
	);
}

export default withInstanceId( RadioControl );
