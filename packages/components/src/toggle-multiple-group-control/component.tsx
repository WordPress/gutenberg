/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * Internal dependencies
 */
import {
	contextConnect,
	ContextSystemProvider,
	WordPressComponentProps,
} from '../ui/context';
import type { ToggleMultipleGroupControlProps } from './types';
import { ToggleGroupControl } from '../toggle-group-control';
import { useContextSystem } from '../ui/context/use-context-system';

const contextProviderValue = {
	ToggleGroupControlOptionBase: {
		isMultiple: true,
	},
};

function UnconnectedToggleMultipleGroupControl(
	props: WordPressComponentProps<
		ToggleMultipleGroupControlProps,
		'div',
		false
	>,
	forwardedRef: ForwardedRef< any >
) {
	const {
		onChange, // omit
		...otherProps
	} = useContextSystem( props, 'UnconnectedToggleMultipleGroupControl' );

	return (
		<ContextSystemProvider value={ contextProviderValue }>
			<ToggleGroupControl
				{ ...otherProps }
				isDeselectable
				__nextHasNoMarginBottom
				ref={ forwardedRef }
			/>
		</ContextSystemProvider>
	);
}

/**
 * `ToggleMultipleGroupControl` is a variant of `ToggleGroupControl` that allows multiple options to be selected.
 * To render options for this control, use the `ToggleMultipleGroupControlOptionIcon` component.
 *
 * Only use this control for icon buttons.
 *
 * ```js
 * import {
 *   __experimentalToggleMultipleGroupControl as ToggleMultipleGroupControl,
 *   __experimentalToggleMultipleGroupControlOptionIcon as ToggleMultipleGroupControlOptionIcon,
 * } from '@wordpress/components';
 * import { useState } from '@wordpress/element';
 * import { formatBold, formatItalic } from '@wordpress/icons';
 *
 * function Example() {
 *   const [ bold, setBold ] = useState( false );
 *   const [ italic, setItalic ] = useState( false );
 *
 *   return (
 *     <ToggleMultipleGroupControl label="My label">
 *       <ToggleMultipleGroupControlOptionIcon
 *         value="bold"
 *         label="Bold"
 *         icon={ formatBold }
 *         isPressed={ bold }
 *         onClick={ () => setBold( ! bold ) }
 *       />
 *       <ToggleMultipleGroupControlOptionIcon
 *         value="italic"
 *         label="Italic"
 *         icon={ formatItalic }
 *         isPressed={ italic }
 *         onClick={ () => setItalic( ! italic ) }
 *       />
 *     </ToggleMultipleGroupControl>
 *   );
 * }
 * ```
 */
export const ToggleMultipleGroupControl = contextConnect(
	UnconnectedToggleMultipleGroupControl,
	'ToggleMultipleGroupControl'
);

export default ToggleMultipleGroupControl;
