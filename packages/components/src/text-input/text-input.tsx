/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { Ref } from 'react';

/**
 * WordPress dependencies
 */
import { useMergeRefs } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { contextConnect, PolymorphicComponentProps } from '../ui/context';
import { View } from '../view';
import TextInputArrows from './text-input-arrows';
import TextInputSteppers from './text-input-steppers';
import { useTextInput } from './hooks/use-text-input';
import * as styles from './styles';
import type { Props } from './types';
import { useCx } from '../utils';

function TextInput(
	props: PolymorphicComponentProps< Props, 'input' >,
	forwardedRef: Ref< any >
) {
	const {
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

	const cx = useCx();

	const showTextInputArrows = arrows === true && isTypeNumeric;
	const showTextInputSteppers = arrows === 'stepper' && isTypeNumeric;
	const mergedRefs = useMergeRefs( [ inputRef, forwardedRef ] );

	return (
		<View { ...otherProps } disabled={ disabled }>
			{ prefix }
			<View
				className={ cx( styles.Input ) }
				autoComplete="off"
				spellCheck={ false }
				{ ...inputProps }
				disabled={ disabled }
				ref={ mergedRefs }
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
 * import { __experimentalTextInput as TextInput } from `@wordpress/components`
 *
 * function Example() {
 *   return <TextInput placeholder="First name" />
 * }
 * ```
 */
const ConnectedTextInput = contextConnect( TextInput, 'TextInput' );

export default ConnectedTextInput;
