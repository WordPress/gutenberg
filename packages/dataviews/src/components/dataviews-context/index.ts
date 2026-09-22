import type { ComponentProps, ReactElement, ReactNode } from 'react';
import { createContext, createRef } from '@wordpress/element';
import type {
	View,
	Action,
	NormalizedField,
	NormalizedSupportedLayouts,
	NormalizedFilter,
	HierarchyPagination,
} from '../../types';
import type { SetSelection } from '../../types/private';
import { LAYOUT_TABLE } from '../../constants';

type DataViewsContextType< Item > = {
	view: View;
	onChangeView: ( view: View ) => void;
	fields: NormalizedField< Item >[];
	actions?: Action< Item >[];
	data: Item[];
	isLoading?: boolean;
	paginationInfo: {
		totalItems: number;
		totalPages: number;
	};
	selection: string[];
	onChangeSelection: SetSelection;
	openedFilter: string | null;
	setOpenedFilter: ( openedFilter: string | null ) => void;
	getItemId: ( item: Item ) => string;
	getItemLevel?: ( item: Item ) => number;
	getItemParentId?: ( item: Item ) => string | number | null | undefined;
	getItemHasChildren?: ( item: Item ) => boolean | undefined;
	expandedItemIds?: string[];
	onChangeExpandedItemIds?: ( itemIds: string[] ) => void;
	hierarchyPagination?: HierarchyPagination;
	isHierarchyPaginationActive?: boolean;
	onClickItem?: ( item: Item ) => void;
	renderItemLink?: (
		props: {
			item: Item;
		} & ComponentProps< 'a' >
	) => ReactElement;
	isItemClickable: ( item: Item ) => boolean;
	containerWidth: number;
	containerRef: React.MutableRefObject< HTMLDivElement | null >;
	resizeObserverRef:
		| ( ( element?: HTMLDivElement | null ) => void )
		| React.RefObject< HTMLDivElement >;
	defaultLayouts: NormalizedSupportedLayouts;
	filters: NormalizedFilter[];
	isShowingFilter: boolean;
	setIsShowingFilter: ( value: boolean ) => void;
	config: { perPageSizes: number[]; mediaFitControl?: boolean };
	empty?: ReactNode;
	hasInitiallyLoaded?: boolean;
	itemListLabel?: string;
	onReset?: ( () => void ) | false;
	intersectionObserver?: IntersectionObserver | null;
};

const DataViewsContext = createContext< DataViewsContextType< any > >( {
	view: { type: LAYOUT_TABLE },
	onChangeView: () => {},
	fields: [],
	data: [],
	paginationInfo: {
		totalItems: 0,
		totalPages: 0,
	},
	selection: [],
	onChangeSelection: () => {},
	setOpenedFilter: () => {},
	openedFilter: null,
	getItemId: ( item ) => item.id,
	isHierarchyPaginationActive: false,
	isItemClickable: () => true,
	renderItemLink: undefined,
	containerWidth: 0,
	containerRef: createRef(),
	resizeObserverRef: () => {},
	defaultLayouts: { list: {}, grid: {}, table: {} },
	filters: [],
	isShowingFilter: false,
	setIsShowingFilter: () => {},
	hasInitiallyLoaded: false,
	config: {
		perPageSizes: [],
	},
	intersectionObserver: null,
} );

DataViewsContext.displayName = 'DataViewsContext';

export default DataViewsContext;
