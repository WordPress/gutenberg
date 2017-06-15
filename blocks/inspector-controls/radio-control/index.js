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

function RadioControl( { label, selected, instanceId, options = [] } ) {
	const id = 'inspector-radio-control-' + instanceId;
	const onChangeValue = ( event ) => onChange( event.target.value );
	
	return ! isEmpty( options ) && (
		<BaseControl label={ label } id={ id }>
			<div className="blocks-radio-control">
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
		</BaseControl>
	);
}

export default withInstanceId( RadioControl );
