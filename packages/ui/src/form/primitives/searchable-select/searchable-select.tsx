import { forwardRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import warning from '@wordpress/warning';
import * as Combobox from '../combobox';
import type { ComboboxCollectionProps } from '../combobox/types';
import { SearchableResults } from '../searchable-results';
import styles from './style.module.css';
import {
	findCreatableItems,
	hasGroupedItems,
	isCreatableItem,
	isItemGroup,
	type Item,
	type ItemGroup,
	type SearchableSelectProps,
} from './types';

function warnSearchableSelectProps(
	items: Item[] | ItemGroup[] | undefined,
	children: ComboboxCollectionProps[ 'children' ] | undefined
): void {
	if ( ! items?.length ) {
		return;
	}

	const creatableItems = findCreatableItems( items );

	if ( creatableItems.length > 1 ) {
		warning(
			'SearchableSelect: expected at most one item with `creatable: true` in `items`.'
		);
	}

	if ( hasGroupedItems( items ) && ! children ) {
		warning(
			'SearchableSelect: grouped `items` require a `children` renderer. See the `Grouped` story for an example.'
		);
	}

	let hasMixedCreatableGroup = false;
	for ( const entry of items ) {
		if (
			isItemGroup( entry ) &&
			entry.items.some( isCreatableItem ) &&
			entry.items.some( ( item ) => ! isCreatableItem( item ) )
		) {
			hasMixedCreatableGroup = true;
			break;
		}
	}

	if ( hasMixedCreatableGroup ) {
		warning(
			'SearchableSelect: do not mix `creatable: true` items with regular items in the same group. Put the creatable item in its own group or last in a flat list.'
		);
	}
}

/**
 * A searchable single-selection component, with support for
 * a footer item to create new items.
 */
export const SearchableSelect = forwardRef<
	HTMLButtonElement,
	SearchableSelectProps
>( function SearchableSelect(
	{
		children,
		emptyContent = __( 'No results found.' ),
		items,
		placeholder,
		triggerContent,
		searchPlaceholder = __( 'Search' ),
		popupWidth,
		'aria-label': ariaLabel,
		'aria-labelledby': ariaLabelledby,
		'aria-describedby': ariaDescribedby,
		...restProps
	},
	ref
) {
	warnSearchableSelectProps( items, children );

	return (
		<Combobox.Root< Item, false > items={ items } { ...restProps }>
			<Combobox.Trigger
				ref={ ref }
				placeholder={ placeholder }
				aria-label={ ariaLabel }
				aria-labelledby={ ariaLabelledby }
				aria-describedby={ ariaDescribedby }
			>
				{ triggerContent }
			</Combobox.Trigger>

			<Combobox.Popup
				width={ popupWidth }
				aria-label={ ariaLabel }
				aria-labelledby={ ariaLabelledby }
			>
				<div className={ styles[ 'input-wrapper' ] }>
					<Combobox.Input
						placeholder={ searchPlaceholder }
						aria-label={ searchPlaceholder }
					/>
				</div>
				<SearchableResults emptyContent={ emptyContent }>
					{ children }
				</SearchableResults>
			</Combobox.Popup>
		</Combobox.Root>
	);
} );
