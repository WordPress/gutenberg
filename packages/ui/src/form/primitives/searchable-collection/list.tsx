import { useContext, type ReactElement } from '@wordpress/element';
import * as Combobox from '../combobox';
import type { ComboboxEmptyProps } from '../combobox/types';
import { isActionEntry, isItem, type Item, type ItemGroup } from './model';
import { SearchableCollectionContext } from './root';

export type SearchableCollectionListProps = {
	emptyContent?: ComboboxEmptyProps[ 'children' ];
};

export function SearchableCollectionList( {
	emptyContent,
}: SearchableCollectionListProps ): ReactElement {
	const { projection, collection } = useContext(
		SearchableCollectionContext
	);

	return (
		<>
			<Combobox.Empty>{ emptyContent }</Combobox.Empty>
			<Combobox.List>
				<Combobox.ListBody>
					<Combobox.Collection>
						{ ( entry: Item | ItemGroup, ...args ) => {
							if ( isActionEntry( entry, projection.action ) ) {
								return null;
							}

							if ( collection ) {
								return collection( entry, ...args );
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
				{ projection.action && (
					<Combobox.ListFooter>
						<Combobox.Item
							variant="creatable"
							value={ projection.action }
							disabled={ projection.action.disabled }
						>
							{ projection.action.label }
						</Combobox.Item>
					</Combobox.ListFooter>
				) }
			</Combobox.List>
		</>
	);
}
