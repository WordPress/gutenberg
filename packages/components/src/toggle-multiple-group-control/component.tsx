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

export const ToggleMultipleGroupControl = contextConnect(
	UnconnectedToggleMultipleGroupControl,
	'ToggleMultipleGroupControl'
);

export default ToggleMultipleGroupControl;
