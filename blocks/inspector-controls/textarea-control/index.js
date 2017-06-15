/**
 * WordPress dependencies
 */
import { withInstanceId } from 'components';

/**
 * Internal dependencies
 */
import './style.scss';

function TextareaControl( { label, value, instanceId, onChange, rows = 3, ...props } ) {
	const id = 'inspector-textarea-control-' + instanceId;
	const onChangeValue = ( event ) => onChange( event.target.value );

	return (
		<div className="blocks-textarea-control">
			<label className="blocks-textarea-control__label" htmlFor={ id }>{ label }</label>
			<textarea className="blocks-textarea-control__input" id={ id } rows={ rows } onChange={ onChangeValue } { ...props }>
				{ value }
			</textarea>
		</div>
	);
}

export default withInstanceId( TextareaControl );
