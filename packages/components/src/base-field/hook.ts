/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useContextSystem, WordPressComponentProps } from '../ui/context';
import { useControlGroupContext } from '../ui/control-group';
import { useFlex } from '../flex';
import * as styles from './styles';
import { useCx } from '../utils/hooks/use-cx';
import type { UseBaseFieldProps } from './types';

/**
 * `useBaseField` is an internal (i.e., not exported in the `index.js`) hook
 * used for building more complex fields like `TextField`.
 * It provides error handling and focus styles for field components.
 * It does _not_ handle layout of the component aside from wrapping the field in a `Flex` wrapper.
 *
 * ```js
 * function useExampleField( props ) {
 * 	const {
 * 		as = 'input',
 * 		...baseProps,
 * 	} = useBaseField( props );
 *
 * 	const inputProps = {
 * 		as,
 * 		// more cool stuff here
 * 	}
 *
 * 	return { inputProps, ...baseProps };
 * }
 *
 * function ExampleField( props, forwardRef ) {
 * 	const {
 * 		preFix,
 * 		affix,
 * 		disabled,
 * 		inputProps,
 * 		...baseProps
 * 	} = useExampleField( props );
 *
 * 	return (
 * 		<View { ...baseProps } disabled={ disabled }>
 * 			{preFix}
 * 			<View
 * 				autocomplete="off"
 * 				{ ...inputProps }
 * 				disabled={ disabled }
 * 			/>
 * 			{affix}
 * 		</View>
 * 	);
 * }
 * ```
 *
 * @param {WordPressComponentProps< UseBaseFieldProps, 'div' >} props
 */
export function useBaseField(
	props: WordPressComponentProps< UseBaseFieldProps, 'div' >
) {
	const {
		className,
		hasError = false,
		isInline = false,
		isSubtle = false,
		// Extract these because useFlex doesn't accept it.
		defaultValue,
		disabled,
		...flexProps
	} = useContextSystem( props, 'BaseField' );

	const { styles: controlGroupStyles } = useControlGroupContext();
	const cx = useCx();

	const classes = useMemo(
		() =>
			cx(
				styles.BaseField,
				controlGroupStyles,
				isSubtle && styles.subtle,
				hasError && styles.error,
				isInline && styles.inline,
				className
			),
		[ className, controlGroupStyles, cx, hasError, isInline, isSubtle ]
	);

	return {
		...useFlex( { children: null, ...flexProps, className: classes } ),
		disabled,
		defaultValue,
	};
}
