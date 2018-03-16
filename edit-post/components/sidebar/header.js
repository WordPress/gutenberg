/**
 * WordPress dependencies
 */
import { Fragment, compose } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { IconButton } from '@wordpress/components';
import { withDispatch, withSelect } from '@wordpress/data';

const SidebarHeader = ( { count, title, activeSidebarName, openSidebar, closeSidebar } ) => {
	// Do not display "0 Blocks".
	count = count === 0 ? 1 : count;

	return (
		<Fragment>
			<div className="components-panel__header edit-post-sidebar__header">
				<span className="edit-post-sidebar__title">
					{ title }
				</span>
				<IconButton
					onClick={ closeSidebar }
					icon="no-alt"
					label={ __( 'Close settings' ) }
				/>
			</div>
			<div className="components-panel__header edit-post-sidebar__panel-tabs">
				<button
					onClick={ () => openSidebar( 'edit-post/document' ) }
					className={ `edit-post-sidebar__panel-tab ${ activeSidebarName === 'edit-post/document' ? 'is-active' : '' }` }
					aria-label={ __( 'Document settings' ) }
				>
					{ __( 'Document' ) }
				</button>
				<button
					onClick={ () => openSidebar( 'edit-post/block' ) }
					className={ `edit-post-sidebar__panel-tab ${ activeSidebarName === 'edit-post/block' ? 'is-active' : '' }` }
					aria-label={ __( 'Block settings' ) }
				>
					{ sprintf( _n( 'Block', '%d Blocks', count ), count ) }
				</button>
				<IconButton
					onClick={ closeSidebar }
					icon="no-alt"
					label={ __( 'Close settings' ) }
				/>
			</div>
		</Fragment>
	);
};

export default compose(
	withSelect( ( select ) => ( {
		count: select( 'core/editor' ).getSelectedBlockCount(),
		title: select( 'core/editor' ).getEditedPostAttribute( 'title' ),
		activeSidebarName: select( 'core/edit-post' ).getActiveGeneralSidebarName(),
	} ) ),
	withDispatch( ( dispatch ) => ( {
		openSidebar: dispatch( 'core/edit-post' ).openGeneralSidebar,
		closeSidebar: dispatch( 'core/edit-post' ).closeGeneralSidebar,
	} ) ),
)( SidebarHeader );
