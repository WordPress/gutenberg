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
import {
	Inserter,
	BlockToolbar,
	TableOfContents,
	EditorHistoryRedo,
	EditorHistoryUndo,
	MultiBlocksSwitcher,
} from '../../../components';
import NavigableToolbar from '../../../components/navigable-toolbar';
import { isFeatureActive } from '../../../selectors';

function HeaderToolbar( { hasFixedToolbar } ) {
	return (
		<NavigableToolbar
			className="editor-header-toolbar"
			aria-label={ __( 'Editor Toolbar' ) }
		>
			<Inserter position="bottom right" />
			<EditorHistoryUndo />
			<EditorHistoryRedo />
			<TableOfContents />
			<MultiBlocksSwitcher />
			{ hasFixedToolbar && (
				<div className="editor-header-toolbar__block-toolbar">
					<BlockToolbar />
				</div>
			) }
		</NavigableToolbar>
	);
}

export default connect(
	( state ) => ( {
		hasFixedToolbar: isFeatureActive( state, 'fixedToolbar' ),
	} )
)( HeaderToolbar );
