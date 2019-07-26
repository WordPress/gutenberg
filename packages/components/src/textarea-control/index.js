/**
 * WordPress dependencies
 */
import { withInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BaseControl from '../base-control';

function TextareaControl( { label, hideLabelFromVision, value, help, instanceId, onChange, rows = 4, className, ...props } ) {
	const id = `inspector-textarea-control-${ instanceId }`;
	const onChangeValue = ( event ) => onChange( event.target.value );

	return (
		<BaseControl label={ label } hideLabelFromVision={ hideLabelFromVision } id={ id } help={ help } className={ className }>
			<textarea
				className="components-textarea-control__input"
				id={ id }
				rows={ rows }
				onChange={ onChangeValue }
				aria-describedby={ !! help ? id + '__help' : undefined }
				value={ value }
				{ ...props }
			/>
		</BaseControl>
	);
}

export default withInstanceId( TextareaControl );
