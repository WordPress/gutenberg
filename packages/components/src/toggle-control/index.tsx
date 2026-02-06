/**
 * External dependencies
 */
import type { ChangeEvent, ForwardedRef } from 'react';
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { FlexBlock } from '../flex';
import FormToggle from '../form-toggle';
import BaseControl from '../base-control';
import type { WordPressComponentProps } from '../context/wordpress-component';
import type { ToggleControlProps } from './types';
import { HStack } from '../h-stack';

function UnforwardedToggleControl(
	{
		label,
		checked,
		help,
		className,
		onChange,
		disabled,
		...additionalProps
	}: WordPressComponentProps< ToggleControlProps, 'input', false >,
	ref: ForwardedRef< HTMLInputElement >
) {
	function onChangeToggle( event: ChangeEvent< HTMLInputElement > ) {
		onChange( event.target.checked );
	}
	const instanceId = useInstanceId( ToggleControl );
	const id = `inspector-toggle-control-${ instanceId }`;

	let describedBy, helpLabel;
	if ( help ) {
		if ( typeof help === 'function' ) {
			// `help` as a function works only for controlled components where
			// `checked` is passed down from parent component. Uncontrolled
			// component can show only a static help label.
			if ( checked !== undefined ) {
				helpLabel = help( checked );
			}
		} else {
			helpLabel = help;
		}
		if ( helpLabel ) {
			describedBy = id + '__help';
		}
	}

	return (
		<BaseControl
			id={ id }
			help={
				helpLabel && (
					<span className="components-toggle-control__help">
						{ helpLabel }
					</span>
				)
			}
			className={ clsx( 'components-toggle-control', className ) }
		>
			<HStack justify="flex-start" spacing={ 2 }>
				<FormToggle
					id={ id }
					checked={ checked }
					onChange={ onChangeToggle }
					aria-describedby={ describedBy }
					disabled={ disabled }
					ref={ ref }
					{ ...additionalProps }
				/>
				<FlexBlock
					as="label"
					htmlFor={ id }
					className={ clsx( 'components-toggle-control__label', {
						'is-disabled': disabled,
					} ) }
				>
					{ label }
				</FlexBlock>
			</HStack>
		</BaseControl>
	);
}

/**
 * ToggleControl is used to generate a toggle user interface.
 *
 * ```jsx
 * import { ToggleControl } from '@wordpress/components';
 * import { useState } from '@wordpress/element';
 *
 * const MyToggleControl = () => {
 *   const [ value, setValue ] = useState( false );
 *
 *   return (
 *     <ToggleControl
 *       label="Fixed Background"
 *       checked={ value }
 *       onChange={ () => setValue( ( state ) => ! state ) }
 *     />
 *   );
 * };
 * ```
 */
export const ToggleControl = forwardRef( UnforwardedToggleControl );
ToggleControl.displayName = 'ToggleControl';

export default ToggleControl;
