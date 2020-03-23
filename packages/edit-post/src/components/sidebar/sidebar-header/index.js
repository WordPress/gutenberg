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
import { close } from '@wordpress/icons';

const SidebarHeader = ( { children, className, closeLabel } ) => {
	const { shortcut, title } = useSelect(
		( select ) => ( {
			shortcut: select(
				'core/keyboard-shortcuts'
			).getShortcutRepresentation( 'core/edit-post/toggle-sidebar' ),
			title: select( 'core/editor' ).getEditedPostAttribute( 'title' ),
		} ),
		[]
	);
	const { closeGeneralSidebar } = useDispatch( 'core/edit-post' );

	// The `tabIndex` serves the purpose of normalizing browser behavior of
	// button clicks and focus. Notably, without making the header focusable, a
	// Button click would not trigger a focus event in macOS Firefox. Thus, when
	// the sidebar is unmounted, the corresponding "focus return" behavior to
	// shift focus back to the heading toolbar would not be run.
	//
	// See: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#Clicking_and_focus

	return (
		<>
			<div className="components-panel__header edit-post-sidebar-header__small">
				<span className="edit-post-sidebar-header__title">
					{ title || __( '(no title)' ) }
				</span>
				<Button
					onClick={ closeGeneralSidebar }
					icon={ close }
					label={ closeLabel }
				/>
			</div>
			<div
				className={ classnames(
					'components-panel__header edit-post-sidebar-header',
					className
				) }
				tabIndex={ -1 }
			>
				{ children }
				<Button
					onClick={ closeGeneralSidebar }
					icon={ close }
					label={ closeLabel }
					shortcut={ shortcut }
				/>
			</div>
		</>
	);
};

export default SidebarHeader;
