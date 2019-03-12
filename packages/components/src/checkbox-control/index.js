/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { withInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BaseControl from '../base-control';

function CheckboxControl( {
	label,
	className,
	heading,
	checked,
	help,
	instanceId,
	onChange,
	mirror,
	...props
} ) {
	const id = `inspector-checkbox-control-${ instanceId }`;
	const onChangeValue = ( event ) => onChange( event.target.checked );

	className = classnames( className, {
		'is-mirrored': mirror,
	} );

	const children = [
		<input
			key="input"
			id={ id }
			className="components-checkbox-control__input"
			type="checkbox"
			value="1"
			onChange={ onChangeValue }
			checked={ checked }
			aria-describedby={ !! help ? id + '__help' : undefined }
			{ ...props }
		/>,
		<label
			key="label"
			className="components-checkbox-control__label"
			htmlFor={ id }
		>
			{ label }
		</label>,
	];

	if ( mirror ) {
		children.reverse();
	}

	return (
		<BaseControl label={ heading } id={ id } help={ help } className={ className }>
			{ children }
		</BaseControl>
	);
}

export default withInstanceId( CheckboxControl );
