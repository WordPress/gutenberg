/**
 * External dependencies
 */
import classNames from 'classnames';
import type { ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { useState, forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import InputBase from './input-base';
import InputField from './input-field';
import type { InputControlProps } from './types';
import { space } from '../ui/utils/space';
import { useDraft } from './utils';
import BaseControl from '../base-control';

const noop = () => {};

function useUniqueId( idProp?: string ) {
	const instanceId = useInstanceId( InputControl );
	const id = `inspector-input-control-${ instanceId }`;

	return idProp || id;
}

export function UnforwardedInputControl(
	{
		__next36pxDefaultSize,
		__unstableStateReducer: stateReducer = ( state ) => state,
		__unstableInputWidth,
		className,
		disabled = false,
		help,
		hideLabelFromVision = false,
		id: idProp,
		isPressEnterToChange = false,
		label,
		labelPosition = 'top',
		onChange = noop,
		onValidate = noop,
		onKeyDown = noop,
		prefix,
		size = 'default',
		style,
		suffix,
		value,
		...props
	}: InputControlProps,
	ref: ForwardedRef< HTMLInputElement >
) {
	const [ isFocused, setIsFocused ] = useState( false );

	const id = useUniqueId( idProp );
	const classes = classNames( 'components-input-control', className );

	const draftHookProps = useDraft( {
		value,
		onBlur: props.onBlur,
		onChange,
	} );

	// ARIA descriptions can only contain plain text, so fall back to aria-details if not.
	const helpPropName =
		typeof help === 'string' ? 'aria-describedby' : 'aria-details';
	const helpProp = !! help ? { [ helpPropName ]: `${ id }__help` } : {};

	return (
		<BaseControl
			className={ classes }
			help={ help }
			id={ id }
			__nextHasNoMarginBottom
		>
			<InputBase
				__next36pxDefaultSize={ __next36pxDefaultSize }
				__unstableInputWidth={ __unstableInputWidth }
				disabled={ disabled }
				gap={ 3 }
				hideLabelFromVision={ hideLabelFromVision }
				id={ id }
				isFocused={ isFocused }
				justify="left"
				label={ label }
				labelPosition={ labelPosition }
				prefix={ prefix }
				size={ size }
				style={ style }
				suffix={ suffix }
			>
				<InputField
					{ ...props }
					{ ...helpProp }
					__next36pxDefaultSize={ __next36pxDefaultSize }
					className="components-input-control__input"
					disabled={ disabled }
					id={ id }
					isFocused={ isFocused }
					isPressEnterToChange={ isPressEnterToChange }
					onKeyDown={ onKeyDown }
					onValidate={ onValidate }
					paddingInlineStart={ prefix ? space( 2 ) : undefined }
					paddingInlineEnd={ suffix ? space( 2 ) : undefined }
					ref={ ref }
					setIsFocused={ setIsFocused }
					size={ size }
					stateReducer={ stateReducer }
					{ ...draftHookProps }
				/>
			</InputBase>
		</BaseControl>
	);
}

/**
 * InputControl components let users enter and edit text. This is an experimental component
 * intended to (in time) merge with or replace `TextControl`.
 *
 * ```jsx
 * import { __experimentalInputControl as InputControl } from '@wordpress/components';
 * import { useState } from '@wordpress/compose';
 *
 * const Example = () => {
 *   const [ value, setValue ] = useState( '' );
 *
 *   return (
 *  	<InputControl
 *  		value={ value }
 *  		onChange={ ( nextValue ) => setValue( nextValue ?? '' ) }
 *  	/>
 *   );
 * };
 * ```
 */
export const InputControl = forwardRef( UnforwardedInputControl );

export default InputControl;
