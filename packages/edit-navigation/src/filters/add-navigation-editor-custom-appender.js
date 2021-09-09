/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import {
	InnerBlocks,
	store as blockEditorStore,
} from '@wordpress/block-editor';

function CustomAppender() {
	return <InnerBlocks.ButtonBlockAppender isToggle />;
}

function EnhancedNavigationBlock( { blockEdit: BlockEdit, ...props } ) {
	const clientId = props.clientId;
	const {
		noBlockSelected,
		isSelected,
		isImmediateParentOfSelectedBlock,
		selectedBlockHasDescendants,
	} = useSelect(
		( select ) => {
			const {
				getClientIdsOfDescendants,
				hasSelectedInnerBlock,
				getSelectedBlockClientId,
			} = select( blockEditorStore );
			const _isImmediateParentOfSelectedBlock = hasSelectedInnerBlock(
				clientId,
				false
			);
			const selectedBlockId = getSelectedBlockClientId();
			const _selectedBlockHasDescendants = !! getClientIdsOfDescendants( [
				selectedBlockId,
			] )?.length;

			return {
				isSelected: selectedBlockId === clientId,
				noBlockSelected: ! selectedBlockId,
				isImmediateParentOfSelectedBlock: _isImmediateParentOfSelectedBlock,
				selectedBlockHasDescendants: _selectedBlockHasDescendants,
			};
		},
		[ clientId ]
	);

	const customAppender =
		noBlockSelected ||
		isSelected ||
		( isImmediateParentOfSelectedBlock && ! selectedBlockHasDescendants )
			? CustomAppender
			: false;

	return <BlockEdit { ...props } customAppender={ customAppender } />;
}

const addNavigationEditorCustomAppender = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		if ( props.name !== 'core/navigation' ) {
			return <BlockEdit { ...props } />;
		}

		// Use a separate component so that `useSelect` only run on the navigation block.
		return <EnhancedNavigationBlock blockEdit={ BlockEdit } { ...props } />;
	},
	'withNavigationEditorCustomAppender'
);

export default () =>
	addFilter(
		'editor.BlockEdit',
		'core/edit-navigation/with-navigation-editor-custom-appender',
		addNavigationEditorCustomAppender
	);
