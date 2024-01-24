/**
 * External dependencies
 */
import createSelector from 'rememo';

/**
 * Internal dependencies
 */
import { INSERTER_PATTERN_TYPES } from '../components/inserter/block-patterns-tab/utils';

export const getUserPatterns = createSelector(
	( state ) => {
		const userPatterns = state.settings.__experimentalReusableBlocks ?? [];
		const userPatternCategories =
			state.settings.__experimentalUserPatternCategories ?? [];
		return userPatterns.map( ( userPattern ) => {
			return {
				name: `core/block/${ userPattern.id }`,
				id: userPattern.id,
				type: INSERTER_PATTERN_TYPES.user,
				title: userPattern.title.raw,
				categories: userPattern.wp_pattern_category.map( ( catId ) => {
					const category = userPatternCategories.find(
						( { id } ) => id === catId
					);
					return category ? category.slug : catId;
				} ),
				content: userPattern.content.raw,
				syncStatus: userPattern.wp_pattern_sync_status,
			};
		} );
	},
	( state ) => [
		state.settings.__experimentalReusableBlocks,
		state.settings.__experimentalUserPatternCategories,
	]
);

export const getAllPatterns = createSelector(
	( state ) => {
		const patterns = state.settings.__experimentalBlockPatterns;
		const userPatterns = getUserPatterns( state );
		return [ ...userPatterns, ...patterns ];
	},
	( state ) => [
		state.settings.__experimentalBlockPatterns,
		getUserPatterns( state ),
	]
);

export const checkAllowList = ( list, item, defaultResult = null ) => {
	if ( typeof list === 'boolean' ) {
		return list;
	}
	if ( Array.isArray( list ) ) {
		// TODO: when there is a canonical way to detect that we are editing a post
		// the following check should be changed to something like:
		// if ( list.includes( 'core/post-content' ) && getEditorMode() === 'post-content' && item === null )
		if ( list.includes( 'core/post-content' ) && item === null ) {
			return true;
		}
		return list.includes( item );
	}
	return defaultResult;
};

export const checkAllowListRecursive = ( blocks, allowedBlockTypes ) => {
	if ( typeof allowedBlockTypes === 'boolean' ) {
		return allowedBlockTypes;
	}

	const blocksQueue = [ ...blocks ];
	while ( blocksQueue.length > 0 ) {
		const block = blocksQueue.shift();

		const isAllowed = checkAllowList(
			allowedBlockTypes,
			block.name || block.blockName,
			true
		);
		if ( ! isAllowed ) {
			return false;
		}

		block.innerBlocks?.forEach( ( innerBlock ) => {
			blocksQueue.push( innerBlock );
		} );
	}

	return true;
};
