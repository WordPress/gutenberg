/**
 * WordPress dependencies
 */
import { withInstanceId } from 'components';

/**
 * Internal dependencies
 */
import BaseControl from './../base-control';
import './style.scss';

function TextareaControl( { label, description, value, instanceId, onChange, rows = 4, ...props } ) {
	const id = 'inspector-textarea-control-' + instanceId;
	const onChangeValue = ( event ) => onChange( event.target.value );

	return (
		<BaseControl label={ label } description={ description } id={ id }>
			<textarea className="blocks-textarea-control__input" id={ id } rows={ rows } onChange={ onChangeValue } { ...props }>
				{ value }
			</textarea>
		</BaseControl>
	);
}

export default withInstanceId( TextareaControl );
