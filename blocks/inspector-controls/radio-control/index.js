/**
 * External dependencies
 */
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { withInstanceId } from 'components';

/**
 * Internal dependencies
 */
import BaseControl from './../base-control';
import './style.scss';

function RadioControl( { label, selected, instanceId, onChange, options = [] } ) {
	const id = 'inspector-radio-control-' + instanceId;
	const onChangeValue = ( event ) => onChange( event.target.value );

	return ! isEmpty( options ) && (
		<BaseControl label={ label } id={ id } className="blocks-radio-control">
			{ options.map( ( option, index ) =>
				<div
					key={ ( id + '-' + index ) }
					className="blocks-radio-control__option"
				>
					<input
						id={ ( id + '-' + index ) }
						className="blocks-radio-control__input"
						type="radio"
						name={ id }
						value={ option.value }
						onChange={ onChangeValue }
						selected={ option.value === selected }
					/>
					<label key={ option.value } htmlFor={ ( id + '-' + index ) }>
						{ option.label }
					</label>
				</div>
			) }
		</BaseControl>
	);
}

export default withInstanceId( RadioControl );
