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
import { isFeatureActive } from '../../../store/selectors';

function HeaderToolbar( { hasFixedToolbar, onShowInspector } ) {
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
					<BlockToolbar onShowInspector={ onShowInspector } />
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
