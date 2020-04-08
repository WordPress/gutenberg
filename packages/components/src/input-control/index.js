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
import {
	Container,
	Fieldset,
	Input,
	Label,
	Legend,
	LegendText,
	Root,
} from './styles/input-control-styles';
import { useControlledState, isEmpty } from './utils';

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
		id: idProp,
		isFloatingLabel = true,
		label,
		size = 'default',
		value: valueProp,
		...props
	},
	ref
) {
	const [ isFocused, setIsFocused ] = useState( false );
	const [ value, setValue ] = useControlledState( valueProp );
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

	const isFilled = ! isEmpty( value );
	const isFloating = isFloatingLabel ? isFilled || isFocused : false;
	const isFloatingLabelSet = isFloatingLabel && label;

	return (
		<Root isFloatingLabel={ isFloatingLabelSet }>
			{ label && (
				<Label
					htmlFor={ id }
					isFloatingLabel={ isFloatingLabel }
					isFilled={ isFilled }
					isFloating={ isFloating }
					size={ size }
				>
					{ label }
				</Label>
			) }
			<Container isFocused={ isFocused }>
				<Input
					{ ...props }
					className={ classes }
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
				<Fieldset
					isFloatingLabel={ isFloatingLabelSet }
					isFocused={ isFocused }
				>
					{ isFloatingLabelSet && (
						<Legend isFloating={ isFloating } size={ size }>
							<LegendText>{ label }</LegendText>
						</Legend>
					) }
				</Fieldset>
				{ children }
			</Container>
		</Root>
	);
}

export default forwardRef( InputControl );
