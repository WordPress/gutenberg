/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';
import deprecated from '@wordpress/deprecated';
import { Icon, check, reset } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import BaseControl from '../base-control';

export default function CheckboxControl( {
	label,
	className,
	heading,
	checked,
	indeterminate,
	help,
	onChange,
	...props
} ) {
	if ( heading ) {
		deprecated( '`heading` prop in `CheckboxControl`', {
			alternative: 'a separate element to implement a heading',
			since: '5.8',
		} );
	}

	const ref = useRef();
	const instanceId = useInstanceId( CheckboxControl );
	const id = `inspector-checkbox-control-${ instanceId }`;
	const onChangeValue = ( event ) => onChange( event.target.checked );

	useEffect( () => {
		ref.current.indeterminate = !! indeterminate;
	}, [ indeterminate ] );

	return (
		<BaseControl
			label={ heading }
			id={ id }
			help={ help }
			className={ classnames( 'components-checkbox-control', className ) }
		>
			<span className="components-checkbox-control__input-container">
				<input
					ref={ ref }
					id={ id }
					className="components-checkbox-control__input"
					type="checkbox"
					value="1"
					onChange={ onChangeValue }
					checked={ ! indeterminate && checked }
					aria-describedby={ !! help ? id + '__help' : undefined }
					{ ...props }
				/>
				{ indeterminate && ! checked ? (
					<Icon
						icon={ reset }
						className="components-checkbox-control__indeterminate"
						role="presentation"
					/>
				) : null }
				{ checked ? (
					<Icon
						icon={ check }
						className="components-checkbox-control__checked"
						role="presentation"
					/>
				) : null }
			</span>
			<label
				className="components-checkbox-control__label"
				htmlFor={ id }
			>
				{ label }
			</label>
		</BaseControl>
	);
}
