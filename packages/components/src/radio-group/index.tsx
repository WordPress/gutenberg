/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import * as Ariakit from '@ariakit/react';

/**
 * WordPress dependencies
 */
import { useMemo, forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ButtonGroup from '../button-group';
import type { WordPressComponentProps } from '../context';
import { RadioGroupContext } from './context';
import type { RadioGroupProps } from './types';

function UnforwardedRadioGroup(
	{
		label,
		checked,
		defaultChecked,
		disabled,
		onChange,
		children,
		...props
	}: WordPressComponentProps< RadioGroupProps, 'div', false >,
	ref: React.ForwardedRef< any >
) {
	const radioStore = Ariakit.useRadioStore( {
		value: checked,
		defaultValue: defaultChecked,
		setValue: ( newValue ) => {
			onChange?.( newValue ?? undefined );
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
				render={ <ButtonGroup>{ children }</ButtonGroup> }
				aria-label={ label }
				ref={ ref }
				{ ...props }
			/>
		</RadioGroupContext.Provider>
	);
}

/**
 * @deprecated Use `RadioControl` or `ToggleGroupControl` instead.
 */
export const RadioGroup = forwardRef( UnforwardedRadioGroup );
export default RadioGroup;
