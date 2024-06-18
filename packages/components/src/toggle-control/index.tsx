/**
 * External dependencies
 */
import type { ChangeEvent, ForwardedRef } from 'react';
import { css } from '@emotion/react';

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
import { useCx } from '../utils';
import { space } from '../utils/space';

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
export function ToggleControl(
	{
		__nextHasNoMarginBottom,
		label,
		checked,
		help,
		className,
		onChange,
		disabled,
	}: WordPressComponentProps< ToggleControlProps, 'input', false >,
	ref: ForwardedRef< HTMLInputElement >
) {
	function onChangeToggle( event: ChangeEvent< HTMLInputElement > ) {
		onChange( event.target.checked );
	}
	const instanceId = useInstanceId( ToggleControl );
	const id = `inspector-toggle-control-${ instanceId }`;

	const cx = useCx();
	const classes = cx(
		'components-toggle-control',
		className,
		! __nextHasNoMarginBottom && css( { marginBottom: space( 3 ) } )
	);

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
			help={ helpLabel }
			className={ classes }
			__nextHasNoMarginBottom
		>
			<HStack justify="flex-start" spacing={ 3 }>
				<FormToggle
					id={ id }
					checked={ checked }
					onChange={ onChangeToggle }
					aria-describedby={ describedBy }
					disabled={ disabled }
					ref={ ref }
				/>
				<FlexBlock
					as="label"
					htmlFor={ id }
					className="components-toggle-control__label"
				>
					{ label }
				</FlexBlock>
			</HStack>
		</BaseControl>
	);
}

export default forwardRef( ToggleControl );
