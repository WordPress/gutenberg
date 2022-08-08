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
import Tooltip from '../tooltip';
import { TooltipWrapper } from './styles/input-control-styles';
import type { InputControlProps, WithTooltipProps } from './types';
import { space } from '../ui/utils/space';
import { useDraft } from './utils';

const noop = () => {};

function useUniqueId( idProp?: string ) {
	const instanceId = useInstanceId( InputControl );
	const id = `inspector-input-control-${ instanceId }`;

	return idProp || id;
}

const WithTooltip = ( { showTooltip, text, children }: WithTooltipProps ) => {
	if ( showTooltip && text ) {
		// Children are wrapped in a simple `div` (`TooltipWrapper`) to prevent
		// rendering issue with Tooltips.
		// See: https://github.com/WordPress/gutenberg/pull/24966#issuecomment-685875026
		return (
			<Tooltip text={ text } position="top center">
				<TooltipWrapper>{ children }</TooltipWrapper>
			</Tooltip>
		);
	}

	return <>{ children }</>;
};

export function UnforwardedInputControl(
	{
		__next36pxDefaultSize,
		__unstableStateReducer: stateReducer = ( state ) => state,
		__unstableInputWidth,
		className,
		disabled = false,
		hideLabelFromVision = false,
		id: idProp,
		isPressEnterToChange = false,
		label,
		labelPosition = 'top',
		onChange = noop,
		onValidate = noop,
		onKeyDown = noop,
		prefix,
		showTooltip = false,
		tooltipText: tooltipTextProp,
		size = 'default',
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

	const tooltipText =
		tooltipTextProp ||
		( typeof label === 'string' ? ( label as string ) : undefined );

	return (
		<InputBase
			__next36pxDefaultSize={ __next36pxDefaultSize }
			__unstableInputWidth={ __unstableInputWidth }
			className={ classes }
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
			suffix={ suffix }
		>
			<WithTooltip showTooltip={ showTooltip } text={ tooltipText }>
				<InputField
					{ ...props }
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
			</WithTooltip>
		</InputBase>
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
