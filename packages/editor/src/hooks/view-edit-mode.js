/**
 * WordPress dependencies
 */
import { Disabled } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { addFilter } from '@wordpress/hooks';

export const withViewEditMode = createHigherOrderComponent( ( BlockListBlock ) => {
	return ( props ) => {
		const { clientId, name } = props;

		const { isAncestorOfPostContent, isDescendantOfPostContent, viewEditingMode } = useSelect( ( select ) => {
			const { isAncestorOfBlockTypeName, isDescendantOfBlockTypeName } = select( 'core/block-editor' );
			const { getViewEditingMode } = select( 'core/editor' );

			return {
				isAncestorOfPostContent: isAncestorOfBlockTypeName( clientId, 'core/post-content' ),
				isDescendantOfPostContent: isDescendantOfBlockTypeName( clientId, 'core/post-content' ),
				viewEditingMode: getViewEditingMode(),
			};
		}, [ clientId ] );

		if ( viewEditingMode !== 'preview' ) {
			return <BlockListBlock { ...props } />;
		}

		if ( isAncestorOfPostContent ) {
			return <BlockListBlock { ...props }
				noInserters={ true }
				noMovers={ true }
				noToolbars={ true }
			/>;
		}

		if ( name === 'core/post-content' ) {
			return <BlockListBlock { ...props }
				noMovers={ true }
				noInserters={ true }
			/>;
		}

		if ( isDescendantOfPostContent ) {
			return <BlockListBlock { ...props } />;
		}

		return (
			<Disabled>
				<BlockListBlock { ...props } />
			</Disabled>
		);
	};
}, 'withViewEditMode' );

addFilter( 'editor.BlockListBlock', 'core/editor/with-view-edit-mode', withViewEditMode );
