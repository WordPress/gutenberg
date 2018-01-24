/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Inserter,
	BlockToolbar,
	TableOfContents,
	EditorHistoryRedo,
	EditorHistoryUndo,
	MultiBlocksSwitcher,
	NavigableToolbar,
} from '@wordpress/editor';

/**
 * Internal dependencies
 */
import './style.scss';
import { hasFixedToolbar } from '../../../store/selectors';

function HeaderToolbar( { fixedToolbarActive } ) {
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
			{ fixedToolbarActive && (
				<div className="editor-header-toolbar__block-toolbar">
					<BlockToolbar />
				</div>
			) }
		</NavigableToolbar>
	);
}

export default connect(
	( state ) => ( {
		fixedToolbarActive: hasFixedToolbar( state ),
	} ),
	undefined,
	undefined,
	{ storeKey: 'edit-post' }
)( HeaderToolbar );
