import { Combobox as BaseCombobox } from '@base-ui/react/combobox';
import type { ReactNode } from 'react';
import * as Combobox from './combobox';
import type { ComboboxCollectionProps } from './combobox/types';

type Item = {
	label: string;
	value: string;
	disabled?: boolean;
	creatable?: boolean;
};

type ItemGroup = {
	label: string;
	items: Item[];
};

type CreatableItem = Item & { creatable: true };

function isItemGroup( entry: Item | ItemGroup ): entry is ItemGroup {
	return 'items' in entry && Array.isArray( entry.items );
}

function isCreatableItem( item: Item ): item is CreatableItem {
	return item.creatable === true;
}

function findCreatableItem(
	items: ReadonlyArray< Item | ItemGroup > | undefined
): CreatableItem | undefined {
	if ( ! items ) {
		return undefined;
	}

	for ( const entry of items ) {
		if ( isItemGroup( entry ) ) {
			const creatable = entry.items.find( isCreatableItem );
			if ( creatable ) {
				return creatable;
			}
			continue;
		}

		if ( isCreatableItem( entry ) ) {
			return entry;
		}
	}

	return undefined;
}

function shouldSkipCollectionEntry( entry: Item | ItemGroup ): boolean {
	if ( isItemGroup( entry ) ) {
		return entry.items.length > 0 && entry.items.every( isCreatableItem );
	}

	return isCreatableItem( entry );
}

/**
 * Empty state and filtered list for `SearchableSelect` and
 * `SearchableChipSelect`. A `creatable: true` item still present in the
 * filtered collection is omitted from the list body and remounted in
 * `ListFooter`. Must render inside `Combobox.Root`.
 */
export function SearchableResults( {
	emptyContent,
	children,
}: {
	emptyContent: ReactNode;
	children?: ComboboxCollectionProps[ 'children' ];
} ) {
	const filteredItems = BaseCombobox.useFilteredItems< Item | ItemGroup >();
	const creatableItem = findCreatableItem( filteredItems );

	return (
		<>
			<Combobox.Empty>{ emptyContent }</Combobox.Empty>
			<Combobox.List>
				<Combobox.ListBody>
					<Combobox.Collection>
						{ ( entry: Item | ItemGroup, ...args ) => {
							if ( shouldSkipCollectionEntry( entry ) ) {
								return null;
							}

							if ( children ) {
								return children( entry, ...args );
							}

							if ( isItemGroup( entry ) ) {
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
		</>
	);
}
