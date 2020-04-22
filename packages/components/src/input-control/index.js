/**
 * External dependencies
 */
import { noop } from 'lodash';
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { useState, forwardRef } from '@wordpress/element';
/**
 * Internal dependencies
 */
import BaseTooltip from '../tooltip';
import VisuallyHidden from '../visually-hidden';
import {
	Container,
	Fieldset,
	Input,
	Label as BaseLabel,
	Legend,
	LegendText,
	Root,
	Suffix,
} from './styles/input-control-styles';
import { useValueState, isValueEmpty } from './utils';

function useUniqueId( idProp ) {
	const instanceId = useInstanceId( InputControl );
	const id = `inspector-input-control-${ instanceId }`;

	return idProp || id;
}

export function InputControl(
	{
		children,
		className,
		onBlur = noop,
		onChange = noop,
		onFocus = noop,
		hideLabelFromVision = false,
		id: idProp,
		suffix,
		isFloatingLabel = true,
		label,
		size = 'default',
		tooltipPosition = 'top',
		value: valueProp,
		...props
	},
	ref
) {
	const [ isFocused, setIsFocused ] = useState( false );
	const [ value, setValue ] = useValueState( valueProp );
	const id = useUniqueId( idProp );
	const classes = classNames( 'component-input-control', className );

	const handleOnBlur = ( event ) => {
		onBlur( event );
		setIsFocused( false );
	};

	const handleOnFocus = ( event ) => {
		onFocus( event );
		setIsFocused( true );
	};

	const handleOnChange = ( event ) => {
		const nextValue = event.target.value;

		onChange( nextValue, { event } );
		setValue( nextValue );
	};

	const isFilled = ! isValueEmpty( value );
	const isFloating = isFloatingLabel ? isFilled || isFocused : false;
	const isFloatingLabelSet =
		! hideLabelFromVision && isFloatingLabel && label;

	return (
		<Root className={ classes } isFloatingLabel={ isFloatingLabelSet }>
			{ label && (
				<Label
					as="label"
					className="component-input-control__label"
					hideLabelFromVision={ hideLabelFromVision }
					htmlFor={ id }
					isFilled={ isFilled }
					isFloating={ isFloating }
					isFloatingLabel={ isFloatingLabel }
					size={ size }
				>
					{ label }
				</Label>
			) }
			<Tooltip
				hideLabelFromVision={ hideLabelFromVision }
				label={ label }
				position={ tooltipPosition }
			>
				<Container
					className="component-input-control__container"
					isFocused={ isFocused }
				>
					<Input
						{ ...props }
						className="component-input-control__input"
						id={ id }
						isFilled={ isFilled }
						isFloating={ isFloating }
						isFloatingLabel={ isFloatingLabel }
						onBlur={ handleOnBlur }
						onChange={ handleOnChange }
						onFocus={ handleOnFocus }
						ref={ ref }
						size={ size }
						value={ value }
					/>
					{ suffix && (
						<Suffix className="component-input-control__suffix">
							{ suffix }
						</Suffix>
					) }
					<Fieldset
						aria-hidden="true"
						className="component-input-control__fieldset"
						isFloatingLabel={ isFloatingLabelSet }
						isFocused={ isFocused }
					>
						{ isFloatingLabelSet && (
							<Legend
								aria-hidden="true"
								className="component-input-control__fieldset-label"
								isFloating={ isFloating }
								size={ size }
							>
								<LegendText className="component-input-control__fieldset-text">
									{ label }
								</LegendText>
							</Legend>
						) }
					</Fieldset>
					{ children }
				</Container>
			</Tooltip>
		</Root>
	);
}

function Label( { children, hideLabelFromVision, htmlFor, ...props } ) {
	if ( hideLabelFromVision ) {
		return (
			<VisuallyHidden as="label" htmlFor={ htmlFor }>
				{ children }
			</VisuallyHidden>
		);
	}

	return (
		<BaseLabel htmlFor={ htmlFor } { ...props }>
			{ children }
		</BaseLabel>
	);
}

function Tooltip( { children, hideLabelFromVision, label, ...props } ) {
	if ( label && hideLabelFromVision ) {
		return (
			<BaseTooltip text={ label } { ...props }>
				{ children }
			</BaseTooltip>
		);
	}

	return children;
}

export default forwardRef( InputControl );
