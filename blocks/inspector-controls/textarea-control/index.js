/**
 * WordPress dependencies
 */
import { withInstanceId } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BaseControl from './../base-control';
import './style.scss';

function TextareaControl( { label, value, instanceId, onChange, rows = 4, ...props } ) {
	const id = 'inspector-textarea-control-' + instanceId;
	const onChangeValue = ( event ) => onChange( event.target.value );

	return (
		<BaseControl label={ label } id={ id }>
			<textarea className="blocks-textarea-control__input" id={ id } rows={ rows } onChange={ onChangeValue } { ...props }>
				{ value }
			</textarea>
		</BaseControl>
	);
}

export default withInstanceId( TextareaControl );
