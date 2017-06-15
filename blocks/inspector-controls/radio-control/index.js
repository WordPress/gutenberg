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

function RadioControl( { label, selected, instanceId, onChange, options = [] } ) {
	const id = 'inspector-radio-control-' + instanceId;
	const onChangeValue = ( event ) => onChange( event.target.value );

	return ! isEmpty( options ) && (
		<BaseControl label={ label } id={ id }>
			<div className="blocks-radio-control">
				{ options.map( ( option, i ) =>
					<label key={ option.value } htmlFor={ ( id + '-' + i ) }>
						<input
							id={ ( id + '-' + i ) }
							className="blocks-radio-control__input"
							type="radio"
							name={ id }
							value={ option.value }
							onChange={ onChangeValue }
							selected={ option.value === selected }
						/>
						{ option.label }
					</label>
				) }
			</div>
		</BaseControl>
	);
}

export default withInstanceId( RadioControl );
