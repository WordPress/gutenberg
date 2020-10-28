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

function useUniqueId( idProp ) {
	const instanceId = useInstanceId( InputBase );
	const id = `input-base-control-${ instanceId }`;

	return idProp || id;
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
	},
	ref
) {
	const id = useUniqueId( idProp );

	return (
		<Root
			{ ...props }
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
				isFocused={ isFocused }
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
				<Backdrop
					aria-hidden="true"
					disabled={ disabled }
					isFocused={ isFocused }
					label={ label }
					size={ size }
				/>
			</Container>
		</Root>
	);
}

export default forwardRef( InputBase );
