/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';

function EnhancedNavigationBlock( { blockEdit: BlockEdit, ...props } ) {
	return (
		<BlockEdit
			{ ...props }
			defaultToTreeView={ true }
			hasTreeViewSetting={ false }
		/>
	);
}

const withNavigationMenuTreeView = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		if ( props.name !== 'core/navigation' ) {
			return <BlockEdit { ...props } />;
		}

		// Use a separate component so that `useSelect` only run on the navigation block.
		return <EnhancedNavigationBlock blockEdit={ BlockEdit } { ...props } />;
	},
	'withNavigationMenuTreeView'
);

export default () =>
	addFilter(
		'editor.BlockEdit',
		'core/edit-navigation/with-navigation-editor-tree-view',
		withNavigationMenuTreeView
	);
