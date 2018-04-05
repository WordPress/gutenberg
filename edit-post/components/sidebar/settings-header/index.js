/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { withDispatch, withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import './style.scss';
import Header from '../header';

const SettingsHeader = ( { count, openSidebar, sidebarName } ) => {
	// Do not display "0 Blocks".
	count = count === 0 ? 1 : count;

	return (
		<Header
			className="edit-post-sidebar__panel-tabs"
			closeLabel={ __( 'Close settings' ) }
		>
			<button
				onClick={ () => openSidebar( 'edit-post/document' ) }
				className={ `edit-post-sidebar__panel-tab ${ sidebarName === 'edit-post/document' ? 'is-active' : '' }` }
				aria-label={ __( 'Document settings' ) }
			>
				{ __( 'Document' ) }
			</button>
			<button
				onClick={ () => openSidebar( 'edit-post/block' ) }
				className={ `edit-post-sidebar__panel-tab ${ sidebarName === 'edit-post/block' ? 'is-active' : '' }` }
				aria-label={ __( 'Block settings' ) }
			>
				{ sprintf( _n( 'Block', '%d Blocks', count ), count ) }
			</button>
		</Header>
	);
};

export default compose(
	withSelect( ( select ) => ( {
		count: select( 'core/editor' ).getSelectedBlockCount(),
	} ) ),
	withDispatch( ( dispatch ) => ( {
		openSidebar: dispatch( 'core/edit-post' ).openGeneralSidebar,
	} ) ),
)( SettingsHeader );
