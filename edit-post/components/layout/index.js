/**
 * External dependencies
 */
import { connect } from 'react-redux';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Popover, navigateRegions } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	MetaBoxes,
	AutosaveMonitor,
	UnsavedChangesWarning,
	EditorNotices,
	DocumentTitle,
} from '@wordpress/editor';

/**
 * Internal dependencies
 */
import './style.scss';
import Header from '../header';
import Sidebar from '../sidebar';
import TextEditor from '../modes/text-editor';
import VisualEditor from '../modes/visual-editor';
import {
	getEditorMode,
	isEditorSidebarOpened,
} from '../../store/selectors';
import {
	toggleSidebar,
	setActivePanel,
} from '../../store/actions';

function Layout( { mode, isSidebarOpened, ...props } ) {
	const className = classnames( 'editor-layout', {
		'is-sidebar-opened': isSidebarOpened,
	} );

	const onShowInspector = () => {
		if ( ! isSidebarOpened ) {
			props.toggleSidebar();
		}
		props.setActivePanel( 'block' );
	};

	return (
		<div className={ className }>
			<DocumentTitle />
			<EditorNotices />
			<UnsavedChangesWarning />
			<AutosaveMonitor />
			<Header onShowInspector={ onShowInspector } />
			<div className="editor-layout__content" role="region" aria-label={ __( 'Editor content' ) } tabIndex="-1">
				<div className="editor-layout__editor">
					{ mode === 'text' && <TextEditor /> }
					{ mode === 'visual' && <VisualEditor onShowInspector={ onShowInspector } /> }
				</div>
				<div className="editor-layout__metaboxes">
					<MetaBoxes location="normal" />
				</div>
			</div>
			{ isSidebarOpened && <Sidebar /> }
			<Popover.Slot />
		</div>
	);
}

export default connect(
	( state ) => ( {
		mode: getEditorMode( state ),
		isSidebarOpened: isEditorSidebarOpened( state ),
	} ),
	{ toggleSidebar, setActivePanel }
)( navigateRegions( Layout ) );
