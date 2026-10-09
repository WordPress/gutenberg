import { Combobox as _Combobox } from '@base-ui/react/combobox';
import type { ComboboxRootProps } from './types';
import { DirectionProvider } from '../../../utils/direction-provider';
import { useIframeOutsidePressBridge } from '../../../utils/use-iframe-outside-press-bridge';

/**
 * Low-level primitive for a combobox that has an associated selection state.
 *
 * See `SearchableSelectControl` and `SearchableChipSelectControl` for standard
 * implementations of a single and multiple selection combobox.
 */
export function Root<
	Value,
	Multiple extends boolean | undefined = false,
	Item = Value,
>( props: ComboboxRootProps< Value, Multiple, Item > ) {
	const iframeDismissalProps =
		useIframeOutsidePressBridge< _Combobox.Root.ChangeEventDetails >( {
			defaultOpen: props.defaultOpen,
			disabled: props.disabled,
			modal: props.modal ?? false,
			onOpenChange: ( nextOpen, eventDetails ) =>
				props.onOpenChange?.( nextOpen, eventDetails ),
			open: props.open,
		} );

	return (
		<DirectionProvider>
			<_Combobox.Root { ...props } { ...iframeDismissalProps } />
		</DirectionProvider>
	);
}
