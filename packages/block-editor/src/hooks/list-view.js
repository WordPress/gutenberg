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
	const { hasChildren, blockTitle } = useSelect(
		( select ) => ( {
			hasChildren:
				!! select( blockEditorStore ).getBlockCount( clientId ),
			blockTitle: select( blocksStore ).getBlockType( name )?.title,
		} ),
		[ clientId, name ]
	);

	if ( ! isEnabled ) {
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
