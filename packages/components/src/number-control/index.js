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
	id = `inspector-number-control-${ instanceId }`,
	onChange,
	help,
	numberUnit,
	...props
} ) {
	const onChangeValue = ( event ) => onChange( Number( event.target.value ) );

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
				onChange={ onChangeValue }
				value={ value }
				aria-label={ id ? undefined : label }
				{ ...props }
			/>

			{ numberUnit && (
				<span className="components-number-control__unit">{ numberUnit }</span>
			) }
		</BaseControl>
	);
}

export default withInstanceId( NumberControl );
