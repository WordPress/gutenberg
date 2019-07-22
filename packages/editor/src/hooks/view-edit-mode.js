/**
 * External dependencies
 */
import { some } from 'lodash';

/**
 * WordPress dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { addFilter } from '@wordpress/hooks';

const postBlockTypes = [ 'core/post-content', 'core/post-date', 'core/post-title' ];

export const withViewEditingModeForBlockEdit = createHigherOrderComponent( ( BlockEdit ) => {
	return ( props ) => {
		const { clientId, name } = props;

		const {
			viewEditingMode,
		} = useSelect( ( select ) => {
			const { getViewEditingMode } = select( 'core/editor' );

			return {
				viewEditingMode: getViewEditingMode(),
			};
		}, [ clientId ] );

		if ( viewEditingMode === 'template' && postBlockTypes.includes( name ) ) {
			return <BlockEdit { ...props } isReadOnly />;
		}

		return (
			<BlockEdit { ...props } isReadOnly={ false } />
		);
	};
}, 'withViewEditingMode' );

export const withViewEditingModeForBlockListBlock = createHigherOrderComponent( ( BlockListBlock ) => {
	return ( props ) => {
		const { clientId, name } = props;

		const {
			isAncestorOfPostBlock,
			isDescendantOfPostBlock,
			viewEditingMode,
		} = useSelect( ( select ) => {
			const { isAncestorOfBlockTypeName, isDescendantOfBlockTypeName } = select( 'core/block-editor' );
			const { getViewEditingMode } = select( 'core/editor' );

			return {
				isAncestorOfPostBlock: some( postBlockTypes, ( postBlockType ) => isAncestorOfBlockTypeName( clientId, postBlockType ) ),
				isDescendantOfPostBlock: some( postBlockTypes, ( postBlockType ) => isDescendantOfBlockTypeName( clientId, postBlockType ) ),
				viewEditingMode: getViewEditingMode(),
			};
		}, [ clientId ] );

		if ( viewEditingMode === 'focus' ) {
			if ( isAncestorOfPostBlock ) {
				return <BlockListBlock { ...props } isReadOnly />;
			}

			if ( postBlockTypes.includes( name ) ) {
				return <BlockListBlock { ...props } isReadOnly />;
			}

			if ( isDescendantOfPostBlock ) {
				return <BlockListBlock { ...props } isReadOnly={ false } />;
			}

			return <BlockListBlock { ...props } isReadOnly />;
		}

		if ( viewEditingMode === 'preview' ) {
			return <BlockListBlock { ...props } isReadOnly />;
		}

		if ( viewEditingMode === 'template' && isDescendantOfPostBlock ) {
			return <BlockListBlock { ...props } isReadOnly />;
		}

		return <BlockListBlock { ...props } isReadOnly={ false } />;
	};
}, 'withViewEditingMode' );

addFilter( 'editor.BlockEdit', 'core/editor/block-edit/with-view-edit-mode', withViewEditingModeForBlockEdit );
addFilter( 'editor.BlockListBlock', 'core/editor/block-list-block/with-view-edit-mode', withViewEditingModeForBlockListBlock );
