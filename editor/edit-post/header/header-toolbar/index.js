/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import { Inserter, BlockToolbar, TableOfContents, EditorHistoryRedo, EditorHistoryUndo } from '../../../components';
import BlockSwitcher from '../../../components/block-switcher';
import NavigableToolbar from '../../../components/navigable-toolbar';
import { getMultiSelectedBlockUids, isFeatureActive } from '../../../selectors';

function HeaderToolbar( { hasFixedToolbar, isMultiBlockSelection, selectedBlockUids } ) {
	return (
		<NavigableToolbar
			className="editor-header-toolbar"
			aria-label={ __( 'Editor Toolbar' ) }
		>
			<Inserter position="bottom right" />
			<EditorHistoryUndo />
			<EditorHistoryRedo />
			<TableOfContents />
			{ isMultiBlockSelection && (
				<div className="editor-header-toolbar__block-toolbar">
					<BlockSwitcher key="switcher" uids={ selectedBlockUids } />
				</div> ) }
			{ hasFixedToolbar && (
				<div className="editor-header-toolbar__block-toolbar">
					<BlockToolbar />
				</div>
			) }
		</NavigableToolbar>
	);
}

export default connect(
	( state ) => {
		const selectedBlockUids = getMultiSelectedBlockUids( state );
		return {
			hasFixedToolbar: isFeatureActive( state, 'fixedToolbar' ),
			isMultiBlockSelection: selectedBlockUids.length > 1,
			selectedBlockUids,
		};
	}
)( HeaderToolbar );
