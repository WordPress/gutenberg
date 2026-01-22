/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as blocksStore, hasBlockSupport } from '@wordpress/blocks';
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../store';
import { PrivateListView } from '../components/list-view';
import InspectorControls from '../components/inspector-controls/fill';
import { PrivateBlockContext } from '../components/block-list/private-block-context';

export const LIST_VIEW_SUPPORT_KEY = 'listView';

/**
 * Check if the block has list view support.
 *
 * @param {string|Object} nameOrType Block name or block type object.
 * @return {boolean} Whether the block has list view support.
 */
export function hasListViewSupport( nameOrType ) {
	return hasBlockSupport( nameOrType, LIST_VIEW_SUPPORT_KEY );
}

/**
 * Inspector controls panel for list view.
 *
 * @param {Object} props          Component props.
 * @param {string} props.clientId Block client ID.
 * @param {string} props.name     Block name.
 * @return {Element|null} List view inspector controls or null.
 */
export function ListViewPanel( { clientId, name } ) {
	const { isSelectionWithinCurrentSection } =
		useContext( PrivateBlockContext );
	const isEnabled = hasListViewSupport( name );
	const { hasChildren, blockTitle, isNestedListView } = useSelect(
		( select ) => {
			const { getBlockCount, getBlockParents, getBlockName } =
				select( blockEditorStore );

			// When the ListView is shown in a section, avoid showing List Views
			// for both parent and child blocks that have support. In this situation
			// the parent will show the child anyway in its List.
			// Search parents to see if there's one that also has support, and if so
			// skip rendering.
			// This matches closely the logic in the `BlockCard` component.
			let _isNestedListView = false;
			if ( isSelectionWithinCurrentSection ) {
				const parents = getBlockParents( clientId, true );
				_isNestedListView = parents.find( ( parentId ) => {
					const parentName = getBlockName( parentId );
					return (
						parentName === 'core/navigation' ||
						hasBlockSupport( parentName, 'listView' )
					);
				} );
			}

			return {
				hasChildren: !! getBlockCount( clientId ),
				blockTitle: select( blocksStore ).getBlockType( name )?.title,
				isNestedListView: _isNestedListView,
			};
		},
		[ clientId, name, isSelectionWithinCurrentSection ]
	);

	if ( ! isEnabled || isNestedListView ) {
		return null;
	}

	const showBlockTitle = isSelectionWithinCurrentSection;

	return (
		<InspectorControls group="list">
			<PanelBody title={ showBlockTitle ? blockTitle : undefined }>
				{ ! hasChildren && (
					<p className="block-editor-block-inspector__no-blocks">
						{ __( 'No items yet.' ) }
					</p>
				) }
				<PrivateListView
					rootClientId={ clientId }
					isExpanded
					description={ blockTitle }
					showAppender
				/>
			</PanelBody>
		</InspectorControls>
	);
}

/**
 * Export block support definition.
 */
export default {
	edit: ListViewPanel,
	hasSupport: hasListViewSupport,
	attributeKeys: [],
	supportsPatternEditing: true,
};
