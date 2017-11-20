/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { flow, noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { isEditorSidebarOpened } from '../../state/selectors';
import { toggleSidebar, setActivePanel } from '../../state/actions';

export function BlockInspectorButton( {
	isSidebarOpened,
	onToggleSidebar,
	onShowInspector,
	onClick = noop,
	small = false,
} ) {
	const toggleInspector = () => {
		onShowInspector();
		if ( ! isSidebarOpened ) {
			onToggleSidebar();
		}
	};
	const label = __( 'Settings' );

	return (
		<IconButton
			className="editor-block-settings-menu__control"
			onClick={ flow( toggleInspector, onClick ) }
			icon="admin-generic"
			label={ small ? label : undefined }
		>
			{ ! small && label }
		</IconButton>
	);
}

export default connect(
	( state ) => ( {
		isSidebarOpened: isEditorSidebarOpened( state ),
	} ),
	( dispatch ) => ( {
		onShowInspector() {
			dispatch( setActivePanel( 'block' ) );
		},
		onToggleSidebar() {
			dispatch( toggleSidebar() );
		},
	} )
)( BlockInspectorButton );
