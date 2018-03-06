/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { IconButton } from '@wordpress/components';
import { withSelect } from '@wordpress/data';

/**
 * Internal Dependencies
 */
import { getActiveGeneralSidebarName } from '../../store/selectors';
import { closeGeneralSidebar, openGeneralSidebar } from '../../store/actions';

const SidebarHeader = ( { activeSidebarName, openSidebar, closeSidebar, count } ) => {
	// Do not display "0 Blocks".
	count = count === 0 ? 1 : count;

	return (
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
	);
};

export default compose(
	withSelect( ( select ) => ( {
		count: select( 'core/editor' ).getSelectedBlockCount(),
	} ) ),
	connect(
		( state ) => ( {
			activeSidebarName: getActiveGeneralSidebarName( state ),
		} ),
		{
			openSidebar: openGeneralSidebar,
			closeSidebar: closeGeneralSidebar,
		},
		undefined,
		{ storeKey: 'edit-post' }
	)
)( SidebarHeader );
