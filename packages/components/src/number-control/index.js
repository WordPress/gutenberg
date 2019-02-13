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

function NumberControl( {
	className,
	label,
	value,
	instanceId,
	onChange,
	help,
	...props
} ) {
	const id = `inspector-number-control-${ instanceId }`;

	return (
		<BaseControl
			label={ label }
			id={ id }
			help={ help }
			className={ classnames( 'components-number-control', className ) }
		>
			<input
				className="components-number-control__input"
				id={ id }
				type="number"
				onChange={ onChange }
				aria-label={ label }
				value={ value }
				{ ...props }
			/>
		</BaseControl>
	);
}

export default withInstanceId( NumberControl );
