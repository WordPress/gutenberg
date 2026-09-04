import { SearchableCollectionList } from './list';
import { SearchableCollectionRoot } from './root';

export type { Item, ItemGroup } from './model';
export { SearchableCollectionList } from './list';
export { SearchableCollectionRoot } from './root';

export const SearchableCollection = {
	Root: SearchableCollectionRoot,
	List: SearchableCollectionList,
};
