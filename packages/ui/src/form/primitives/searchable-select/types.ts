import type { Combobox as _Combobox } from '@base-ui/react/combobox';
import type {
	ComboboxCollectionProps,
	ComboboxEmptyProps,
	ComboboxInputProps,
	ComboboxTriggerProps,
} from '../combobox/types';
import type { SelectItem } from '../../select-control/types';

export type SearchableSelectProps = Omit<
	_Combobox.Root.Props< SelectItem, false >,
	'children' | 'className' | 'items' | 'multiple'
> &
	Pick<
		React.ComponentProps< typeof _Combobox.Trigger >,
		'aria-label' | 'aria-labelledby' | 'aria-describedby'
	> & {
		/**
		 * The array of option items.
		 */
		items?: SelectItem[];
		/**
		 * A render function for custom rendering the list of matching items.
		 */
		children?: ComboboxCollectionProps[ 'children' ];
		/**
		 * The item that triggers the creation of a new item.
		 */
		creatableItem?: SelectItem;
		/**
		 * The custom trigger content to use instead of the default.
		 *
		 * ```jsx
		 * triggerContent={ ( value ) => (
		 *   <span>
		 *     <Icon icon={ wordpress } />
		 *     { value }
		 *   </span>
		 * ) }
		 * ```
		 */
		triggerContent?: ComboboxTriggerProps[ 'children' ];
		/**
		 * The custom content to use instead of the default empty state,
		 * which shows whenever there are no matching items.
		 */
		emptyContent?: ComboboxEmptyProps[ 'children' ];
		/**
		 * The placeholder text to use for the search input.
		 */
		searchPlaceholder?: ComboboxInputProps[ 'placeholder' ];
	};
