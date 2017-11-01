/**
 * External dependencies
 */
import { connect } from 'react-redux';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { NoticeList, Popover, navigateRegions } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import Header from '../header';
import PostSettingsSidebar from '../post-settings-sidebar';
import PostPublishSidebar from '../post-publish-sidebar';
import BlockInspectorSidebar from '../block-inspector-sidebar';
import TextEditor from '../modes/text-editor';
import VisualEditor from '../modes/visual-editor';
import UnsavedChangesWarning from '../unsaved-changes-warning';
import DocumentTitle from '../document-title';
import AutosaveMonitor from '../autosave-monitor';
import { removeNotice } from '../actions';
import MetaBoxes from '../meta-boxes';
import {
	getEditorMode,
	getNotices,
} from '../selectors';

function Layout( { mode, notices, ...props } ) {
	const className = classnames( 'editor-layout' );

	return (
		<div className={ className }>
			<DocumentTitle />
			<NoticeList onRemove={ props.removeNotice } notices={ notices } />
			<UnsavedChangesWarning />
			<AutosaveMonitor />
			<Header />
			<div className="editor-layout__content" role="region" aria-label={ __( 'Editor content' ) } tabIndex="-1">
				<div className="editor-layout__editor">
					{ mode === 'text' && <TextEditor /> }
					{ mode === 'visual' && <VisualEditor /> }
				</div>
				<div className="editor-layout__metaboxes">
					<MetaBoxes location="normal" />
				</div>
			</div>
			<PostSettingsSidebar />
			<PostPublishSidebar />
			<BlockInspectorSidebar />
			<Popover.Slot />
		</div>
	);
}

export default connect(
	( state ) => ( {
		mode: getEditorMode( state ),
		notices: getNotices( state ),
	} ),
	{ removeNotice }
)( navigateRegions( Layout ) );
