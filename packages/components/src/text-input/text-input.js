/**
 * WordPress dependencies
 */
import { useMergeRefs } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { contextConnect } from '../ui/context';
import { View } from '../view';
import TextInputArrows from './text-input-arrows';
import TextInputSteppers from './text-input-steppers';
import { useTextInput } from './use-text-input';
import * as styles from './styles';

/**
 *
 * @param {import('@wp-g2/create-styles').ViewOwnProps<import('./types').Props, 'input'>} props
 * @param {import('react').Ref<any>} forwardedRef
 */
function TextInput( props, forwardedRef ) {
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

	const showTextInputArrows = arrows === true && isTypeNumeric;
	const showTextInputSteppers = arrows === 'stepper' && isTypeNumeric;
	const mergedRefs = useMergeRefs( [ inputRef, forwardedRef ] );

	return (
		<View
			{ ...otherProps }
			disabled={ disabled }
			{ ...styles.TextInputWrapper }
		>
			{ prefix }
			<View
				{ ...styles.Input }
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
 * import { TextInput } from `@wp-g2/components`
 *
 * function Example() {
 *   return <TextInput placeholder="First name" />
 * }
 * ```
 */
const ConnectedTextInput = contextConnect( TextInput, 'TextInput' );

export default ConnectedTextInput;
