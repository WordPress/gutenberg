/**
 * Internal dependencies
 */
import BaseControl from '../base-control';
import withInstanceId from '../higher-order/with-instance-id';
import './style.scss';

function TextControl( { label, value, help, className, instanceId, min, onChange, type = 'text', ...props } ) {
	const id = `inspector-text-control-${ instanceId }`;
	const onChangeValue = ( event ) => onChange( event.target.value );

	return (
		<BaseControl label={ label } id={ id } help={ help } className={ className }>
			<input className="components-text-control__input"
				type={ type }
				id={ id }
				value={ value }
				min={ min }
				onChange={ onChangeValue }
				aria-describedby={ !! help ? id + '__help' : undefined }
				{ ...props }
			/>
		</BaseControl>
	);
}

export default withInstanceId( TextControl );
