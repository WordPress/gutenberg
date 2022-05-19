/**
 * External dependencies
 */
import { isFunction } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import FormToggle from '../form-toggle';
import BaseControl from '../base-control';

export default function ToggleControl( {
	label,
	checked,
	help,
	className,
	onChange,
	disabled,
} ) {
	function onChangeToggle( event ) {
		onChange( event.target.checked );
	}
	const instanceId = useInstanceId( ToggleControl );
	const id = `inspector-toggle-control-${ instanceId }`;

	let describedBy, helpLabel;
	if ( help ) {
		describedBy = id + '__help';
		helpLabel = isFunction( help ) ? help( checked ) : help;
	}

	return (
		<BaseControl
			id={ id }
			help={ helpLabel }
			className={ classnames( 'components-toggle-control', className ) }
		>
			<FormToggle
				id={ id }
				checked={ checked }
				onChange={ onChangeToggle }
				aria-describedby={ describedBy }
				disabled={ disabled }
			/>
			<label htmlFor={ id } className="components-toggle-control__label">
				{ label }
			</label>
		</BaseControl>
	);
}
