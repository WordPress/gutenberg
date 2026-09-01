import { forwardRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import warning from '@wordpress/warning';
import * as Combobox from '../combobox';
import type { ComboboxCollectionProps } from '../combobox/types';
import styles from './style.module.css';
import {
	findCreatableItem,
	findCreatableItems,
	hasGroupedItems,
	isItem,
	normalizeRootItems,
	shouldSkipCollectionEntry,
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

	const creatableItem = findCreatableItem( items );
	const comboboxItems = normalizeRootItems( items );

	return (
		<Combobox.Root< Item, false > items={ comboboxItems } { ...restProps }>
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
				<Combobox.Empty>{ emptyContent }</Combobox.Empty>
				<Combobox.List>
					<Combobox.ListBody>
						<Combobox.Collection>
							{ ( entry: Item | ItemGroup, ...args ) => {
								if (
									shouldSkipCollectionEntry(
										entry,
										creatableItem
									)
								) {
									return null;
								}

								if ( children ) {
									return children( entry, ...args );
								}

								if ( ! isItem( entry ) ) {
									return null;
								}

								return (
									<Combobox.Item
										key={ entry.value }
										value={ entry }
										disabled={ entry.disabled }
									>
										{ entry.label }
									</Combobox.Item>
								);
							} }
						</Combobox.Collection>
					</Combobox.ListBody>
					{ creatableItem && (
						<Combobox.ListFooter>
							<Combobox.Item
								variant="creatable"
								value={ creatableItem }
								disabled={ creatableItem.disabled }
							>
								{ creatableItem.label }
							</Combobox.Item>
						</Combobox.ListFooter>
					) }
				</Combobox.List>
			</Combobox.Popup>
		</Combobox.Root>
	);
} );
