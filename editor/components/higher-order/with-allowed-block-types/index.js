/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import { compose, createHigherOrderComponent } from '@wordpress/element';
import { withEditorSettings } from '@wordpress/blocks';

/**
 * Higher-order component, which computes allowedBlockTypes.
 *
 * @param {?Function} getRootBlockUid Function that receives props and select
 *                                    and returns the rootBlock whose allowedBlockTypes we want to retrieve.
 *                                    If the function is not provided we query the state to know the Block Insertion Point.
 *
 * @return {Function} Higher-order component.
 */
export default ( getRootBlockUid ) => createHigherOrderComponent( compose( [
	withEditorSettings( ( settings ) => {
		const { allowedBlockTypes = true, templateLock } = settings;
		const isLocked = !! templateLock;
		return {
			allowedBlockTypes: isLocked || ( allowedBlockTypes && allowedBlockTypes.length === 0 ) ? false : allowedBlockTypes,
		};
	} ),
	withSelect( ( select, props ) => {
		const {
			getBlockInsertionPoint,
			getSupportedBlocks,
		} = select( 'core/editor' );
		const rootUID = getRootBlockUid ?
			getRootBlockUid( props, select ) :
			getBlockInsertionPoint().rootUID;
		const allowedBlockTypes = getSupportedBlocks( rootUID, props.allowedBlockTypes );
		// Todo: move false if empty logic to selector getSupportedBlocks.
		return {
			allowedBlockTypes: allowedBlockTypes && allowedBlockTypes.length === 0 ? false : allowedBlockTypes,
		};
	} ),
] ),
'withAllowedBlockTypes'
);
