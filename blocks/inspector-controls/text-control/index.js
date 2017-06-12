/**
 * WordPress dependencies
 */
import { withInstanceId } from 'components';

function TextControl( { label, value, instanceId, onChange, ...attributes } ) {
	const id = 'inspector-text-control-' + instanceId;
    const type = attributes.type || 'text';
	const onChangeValue = ( event ) => onChange( event.target.value );

	return (
		<div className="blocks-inspector-control">
			<label className="blocks-inspector-control__label" htmlFor={ id }>{ label }</label>
			<input className="blocks-inspector-control__input" type={ type } id={ id } value={ value } onChange={ onChangeValue } { ...attributes } />
		</div>
	);
}

export default withInstanceId( TextControl );
