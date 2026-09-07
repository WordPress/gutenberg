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

function isItem( entry: Item | ItemGroup ): entry is Item {
	return ! isItemGroup( entry );
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

function shouldSkipCollectionEntry(
	entry: Item | ItemGroup,
	creatableItem: CreatableItem | undefined
): boolean {
	if ( ! creatableItem ) {
		return false;
	}

	if ( isItem( entry ) ) {
		return isCreatableItem( entry );
	}

	return (
		entry.items.length > 0 &&
		entry.items.every( ( item ) => isCreatableItem( item ) )
	);
}

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
		</>
	);
}
