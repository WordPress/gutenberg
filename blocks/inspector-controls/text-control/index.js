/**
 * WordPress dependencies
 */
import { withInstanceId } from 'components';

function TextControl( { label, value, instanceId, onChange } ) {
	const id = 'inspector-text-control-' + instanceId;
	const onChangeValue = ( event ) => onChange( event.target.value );

	return (
		<div className="blocks-inspector-control">
			<label className="blocks-inspector-control__label" htmlFor={ id }>{ label }</label>
			<input className="blocks-inspector-control__input" id={ id } value={ value } onChange={ onChangeValue } />
		</div>
	);
}

export default withInstanceId( TextControl );
