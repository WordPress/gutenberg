import { contextConnect } from '@wp-g2/context';
import { ui } from '@wp-g2/styles';
import { mergeRefs } from '@wp-g2/utils';
import React from 'react';

import { View } from '../View';
import TextInputArrows from './text-input-arrows';
import TextInputSteppers from './text-input-steppers';
import { useTextInput } from './useTextInput';

/**
 *
 * @param {import('@wp-g2/create-styles').ViewOwnProps<import('./types').Props, 'input'>} props
 * @param {import('react').Ref<any>} forwardedRef
 */
function TextInput( props, forwardedRef ) {
	const {
		__store,
		arrows,
		decrement,
		disabled,
		dragHandlersRef,
		increment,
		inputProps,
		inputRef,
		isTypeNumeric,
		prefix,
		suffix,
		...otherProps
	} = useTextInput( props );

	const showTextInputArrows = arrows === true && isTypeNumeric;
	const showTextInputSteppers = arrows === 'stepper' && isTypeNumeric;

	return (
		<View
			{ ...otherProps }
			disabled={ disabled }
			{ ...ui.$( 'TextInputWrapper' ) }
		>
			{ prefix }
			<View
				{ ...ui.$( 'TextInput' ) }
				autoComplete="off"
				spellCheck={ false }
				{ ...inputProps }
				disabled={ disabled }
				ref={ mergeRefs( [ inputRef, forwardedRef ] ) }
			/>
			{ suffix }
			{ showTextInputArrows && (
				<TextInputArrows
					decrement={ decrement }
					dragHandlersRef={ dragHandlersRef }
					increment={ increment }
				/>
			) }
			{ showTextInputSteppers && (
				<TextInputSteppers
					decrement={ decrement }
					disabled={ !! disabled }
					dragHandlersRef={ dragHandlersRef }
					increment={ increment }
				/>
			) }
		</View>
	);
}

/**
 * `TextInput` is a form component that users can enter content into.
 *
 * @example
 * ```jsx
 * import { TextInput } from `@wp-g2/components`
 *
 * function Example() {
 *   return <TextInput placeholder="First name" />
 * }
 * ```
 */
const ConnectedTextInput = contextConnect( TextInput, 'TextInput' );

export default ConnectedTextInput;
