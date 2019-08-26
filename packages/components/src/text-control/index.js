/**
 * WordPress dependencies
 */
import { withInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BaseControl from '../base-control';

function TextControl( { label, hideLabelFromVision, value, help, className, instanceId, onChange, type = 'text', ...props } ) {
	const id = `inspector-text-control-${ instanceId }`;
	const onChangeValue = ( event ) => onChange( event.target.value );

	return (
		<BaseControl label={ label } hideLabelFromVision={ hideLabelFromVision } id={ id } help={ help } className={ className }>
			<input className="components-text-control__input"
				type={ type }
				id={ id }
				value={ value }
				onChange={ onChangeValue }
				aria-describedby={ !! help ? id + '__help' : undefined }
				{ ...props }
			/>
		</BaseControl>
	);
}

export default withInstanceId( TextControl );
