/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';

const SidebarHeader = ( { children, className, closeLabel } ) => {
	const { shortcut, title } = useSelect( ( select ) => ( {
		shortcut: select( 'core/keyboard-shortcuts' ).getShortcutRepresentation( 'core/edit-post/toggle-sidebar' ),
		title: select( 'core/editor' ).getEditedPostAttribute( 'title' ),
	} ), [] );
	const { closeGeneralSidebar } = useDispatch( 'core/edit-post' );

	return (
		<>
			<div className="components-panel__header edit-post-sidebar-header__small">
				<span className="edit-post-sidebar-header__title">
					{ title || __( '(no title)' ) }
				</span>
				<Button
					onClick={ closeGeneralSidebar }
					icon="no-alt"
					label={ closeLabel }
				/>
			</div>
			<div className={ classnames( 'components-panel__header edit-post-sidebar-header', className ) }>
				{ children }
				<Button
					onClick={ closeGeneralSidebar }
					icon="no-alt"
					label={ closeLabel }
					shortcut={ shortcut }
				/>
			</div>
		</>
	);
};

export default SidebarHeader;
