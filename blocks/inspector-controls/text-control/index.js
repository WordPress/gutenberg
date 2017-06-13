/**
 * WordPress dependencies
 */
import { withInstanceId } from 'components';

/**
 * Internal dependencies
 */
import './style.scss';

function TextControl( { label, value, instanceId, onChange, type = 'text', ...props } ) {
	const id = 'inspector-text-control-' + instanceId;
	const onChangeValue = ( event ) => onChange( event.target.value );

	return (
		<div className="blocks-text-control">
			<label className="blocks-text-control__label" htmlFor={ id }>{ label }</label>
			<input className="blocks-text-control__input" type={ type } id={ id } value={ value } onChange={ onChangeValue } { ...props } />
		</div>
	);
}

export default withInstanceId( TextControl );
