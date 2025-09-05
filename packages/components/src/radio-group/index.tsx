/**
 * External dependencies
 */
import * as Ariakit from '@ariakit/react';

/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';
import { useMemo, forwardRef } from '@wordpress/element';
import { isRTL } from '@wordpress/i18n';

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
		rtl: isRTL(),
	} );

	const contextValue = useMemo(
		() => ( {
			store: radioStore,
			disabled,
		} ),
		[ radioStore, disabled ]
	);

	deprecated( 'wp.components.__experimentalRadioGroup', {
		alternative:
			'wp.components.RadioControl or wp.components.__experimentalToggleGroupControl',
		since: '6.8',
	} );

	return (
		<RadioGroupContext.Provider value={ contextValue }>
			<Ariakit.RadioGroup
				store={ radioStore }
				render={
					<ButtonGroup __shouldNotWarnDeprecated>
						{ children }
					</ButtonGroup>
				}
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
