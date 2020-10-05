/**
 * External dependencies
 */
import createStore from 'zustand';
import shallow from 'zustand/shallow';

export const useMenuStore = createStore( ( set ) => ( {
	hoveredItem: null,
	setHoveredItem: ( next ) => {
		set( { hoveredItem: next } );
	},
	searchQuery: '',
	setSearchQuery: ( next ) => {
		set( { searchQuery: next } );
	},
	clearSearchQuery: () => {
		set( { searchQuery: '', hoveredItem: null } );
	},
} ) );

export const useHoveredItem = () => {
	return useMenuStore( ( state ) => {
		return [ state.hoveredItem, state.setHoveredItem ];
	}, shallow );
};

export const useSetHoveredItem = () => {
	return useMenuStore( ( state ) => {
		return state.setHoveredItem;
	}, shallow );
};

export const useSearchQuery = () => {
	return useMenuStore( ( state ) => {
		return [ state.searchQuery, state.setSearchQuery ];
	}, shallow );
};
