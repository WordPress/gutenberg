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
		children,
		className,
		disabled = false,
		hideLabelFromVision = false,
		id: idProp,
		isFloatingLabel = false,
		isFilled = false,
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

	const isFloating = isFloatingLabel ? isFilled || isFocused : false;
	const isFloatingLabelSet =
		! hideLabelFromVision && isFloatingLabel && label;

	return (
		<Root
			{ ...props }
			className={ className }
			isFloatingLabel={ isFloatingLabelSet }
			isFocused={ isFocused }
			ref={ ref }
		>
			<LabelWrapper>
				<Label
					className="components-input-control__label"
					hideLabelFromVision={ hideLabelFromVision }
					htmlFor={ id }
					isFilled={ isFilled }
					isFloating={ isFloating }
					isFloatingLabel={ isFloatingLabel }
					size={ size }
				>
					{ label }
				</Label>
			</LabelWrapper>
			<Container
				className="components-input-control__container"
				disabled={ disabled }
				isFocused={ isFocused }
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
					isFloating={ isFloating }
					isFloatingLabel={ isFloatingLabelSet }
					isFocused={ isFocused }
					label={ label }
					size={ size }
				/>
			</Container>
		</Root>
	);
}

export default forwardRef( InputBase );
