/**
 * WordPress dependencies
 */
import { forwardRef, useContext } from '@wordpress/element';

/**
 * External dependencies
 */
import * as Ariakit from '@ariakit/react';

/**
 * Internal dependencies
 */
import Button from '../button';
import { RadioGroupContext } from './context';
import type { WordPressComponentProps } from '../context';
import type { RadioProps } from './types';
import { maybeWarnDeprecated36pxSize } from '../utils/deprecated-36px-size';

function UnforwardedRadio(
	{
		value,
		children,
		...props
	}: WordPressComponentProps< RadioProps, 'button', false >,
	ref: React.ForwardedRef< any >
) {
	const { store, disabled } = useContext( RadioGroupContext );

	const selectedValue = Ariakit.useStoreState( store, 'value' );
	const isChecked = selectedValue !== undefined && selectedValue === value;

	maybeWarnDeprecated36pxSize( {
		componentName: 'Radio',
		size: undefined,
		__next40pxDefaultSize: props.__next40pxDefaultSize,
	} );

	return (
		<Ariakit.Radio
			disabled={ disabled }
			store={ store }
			ref={ ref }
			value={ value }
			render={
				<Button
					variant={ isChecked ? 'primary' : 'secondary' }
					{ ...props }
				/>
			}
		>
			{ children || value }
		</Ariakit.Radio>
	);
}

/**
 * @deprecated Use `RadioControl` or `ToggleGroupControl` instead.
 */
export const Radio = forwardRef( UnforwardedRadio );
export default Radio;
