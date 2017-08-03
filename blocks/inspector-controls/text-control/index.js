/**
 * WordPress dependencies
 */
import { withInstanceId } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BaseControl from './../base-control';
import './style.scss';

function TextControl( { label, value, instanceId, onChange, type = 'text', ...props } ) {
	const id = 'inspector-text-control-' + instanceId;
	const onChangeValue = ( event ) => onChange( event.target.value );

	return (
		<BaseControl label={ label } id={ id }>
			<input className="blocks-text-control__input" type={ type } id={ id } value={ value } onChange={ onChangeValue } { ...props } />
		</BaseControl>
	);
}

export default withInstanceId( TextControl );
