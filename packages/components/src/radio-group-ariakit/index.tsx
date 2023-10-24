/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import * as Ariakit from '@ariakit/react';

/**
 * WordPress dependencies
 */
import {
	createContext,
	useMemo,
	useContext,
	forwardRef,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import ButtonGroup from '../button-group';
import Button from '../button';

const RadioGroupContext = createContext< {
	store?: Ariakit.RadioStore;
	disabled?: boolean;
} >( {
	store: undefined,
	disabled: undefined,
} );

function UnforwardedRadioGroup(
	{
		label,
		checked,
		defaultChecked,
		disabled,
		onChange,
		...props
	}: Record< string, any >,
	ref: React.ForwardedRef< any >
) {
	const radioStore = Ariakit.useRadioStore( {
		value: checked,
		defaultValue: defaultChecked,
		setValue: ( newValue ) => {
			onChange?.( newValue );
		},
	} );

	const contextValue = useMemo(
		() => ( {
			store: radioStore,
			disabled,
		} ),
		[ radioStore, disabled ]
	);

	return (
		<RadioGroupContext.Provider value={ contextValue }>
			<Ariakit.RadioGroup
				store={ radioStore }
				// @ts-ignore TODO: investigate how to tell TypeScript that children will be passed
				render={ <ButtonGroup /> }
				aria-label={ label }
				ref={ ref }
				data-markus="true"
				{ ...props }
			/>
		</RadioGroupContext.Provider>
	);
}

export const RadioGroup = forwardRef( UnforwardedRadioGroup );
export default RadioGroup;

function UnforwardedRadio(
	{ value, children }: Record< string, any >,
	ref: React.ForwardedRef< any >
) {
	const { store, disabled } = useContext( RadioGroupContext );

	const selectedValue = store?.useState( 'value' );
	const isChecked = selectedValue !== undefined && selectedValue === value;

	return (
		<Ariakit.Radio
			disabled={ disabled }
			store={ store }
			ref={ ref }
			value={ value }
			render={
				<Button variant={ isChecked ? 'primary' : 'secondary' } />
			}
		>
			{ children || value }
		</Ariakit.Radio>
	);
}

export const Radio = forwardRef( UnforwardedRadio );
