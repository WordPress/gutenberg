/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Backdrop from './backdrop';
import Label from './label';
import {
	Container,
	Root,
	Prefix,
	Suffix,
	LabelWrapper,
} from './styles/input-control-styles';
import type { InputBaseProps, LabelPosition } from './types';

function useUniqueId( idProp?: string ) {
	const instanceId = useInstanceId( InputBase );
	const id = `input-base-control-${ instanceId }`;

	return idProp || id;
}

// Adapter to map props for the new ui/flex compopnent.
function getUIFlexProps( labelPosition?: LabelPosition ) {
	const props: { direction?: string; gap?: number; justify?: string } = {};
	switch ( labelPosition ) {
		case 'top':
			props.direction = 'column';
			props.gap = 0;
			break;
		case 'bottom':
			props.direction = 'column-reverse';
			props.gap = 0;
			break;
		case 'edge':
			props.justify = 'space-between';
			break;
	}

	return props;
}

export function InputBase(
	{
		__unstableInputWidth,
		children,
		className,
		disabled = false,
		hideLabelFromVision = false,
		labelPosition,
		id: idProp,
		isFocused = false,
		label,
		prefix,
		size = 'default',
		suffix,
		...props
	}: InputBaseProps,
	ref: ForwardedRef< HTMLDivElement >
) {
	const id = useUniqueId( idProp );
	const hideLabel = hideLabelFromVision || ! label;

	return (
		// @ts-expect-error The `direction` prop from Flex (FlexDirection) conflicts with legacy SVGAttributes `direction` (string) that come from React intrinsic prop definitions
		<Root
			{ ...props }
			{ ...getUIFlexProps( labelPosition ) }
			className={ className }
			isFocused={ isFocused }
			labelPosition={ labelPosition }
			ref={ ref }
		>
			<LabelWrapper>
				<Label
					className="components-input-control__label"
					hideLabelFromVision={ hideLabelFromVision }
					labelPosition={ labelPosition }
					htmlFor={ id }
					size={ size }
				>
					{ label }
				</Label>
			</LabelWrapper>
			<Container
				__unstableInputWidth={ __unstableInputWidth }
				className="components-input-control__container"
				disabled={ disabled }
				hideLabel={ hideLabel }
				labelPosition={ labelPosition }
			>
				{ prefix && (
					<Prefix className="components-input-control__prefix">
						{ prefix }
					</Prefix>
				) }
				{ children }
				{ suffix && (
					<Suffix className="components-input-control__suffix">
						{ suffix }
					</Suffix>
				) }
				<Backdrop disabled={ disabled } isFocused={ isFocused } />
			</Container>
		</Root>
	);
}

export default forwardRef( InputBase );
