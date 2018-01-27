/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { flow, noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton, withSpokenMessages } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getActivePanel, isSidebarOpened } from '../../../store/selectors';
import { toggleSidebar, setActivePanel } from '../../../store/actions';

export function BlockInspectorButton( {
	isDefaultSidebarOpened,
	panel,
	toggleDefaultSidebar,
	onShowInspector,
	onClick = noop,
	small = false,
	speak,
} ) {
	const toggleInspector = () => {
		onShowInspector();
		if ( ! isDefaultSidebarOpened || panel === 'block' ) {
			toggleDefaultSidebar();
		}
	};

	const speakMessage = () => {
		if ( ! isDefaultSidebarOpened || ( isDefaultSidebarOpened && panel !== 'block' ) ) {
			speak( __( 'Additional settings are now available in the Editor advanced settings sidebar' ) );
		} else {
			speak( __( 'Advanced settings closed' ) );
		}
	};

	const label = ( isDefaultSidebarOpened && panel === 'block' ) ? __( 'Hide Advanced Settings' ) : __( 'Show Advanced Settings' );

	return (
		<IconButton
			className="editor-block-settings-menu__control"
			onClick={ flow( toggleInspector, speakMessage, onClick ) }
			icon="admin-generic"
			label={ small ? label : undefined }
		>
			{ ! small && label }
		</IconButton>
	);
}

export default connect(
	( state ) => ( {
		isDefaultSidebarOpened: isSidebarOpened( state ),
		panel: getActivePanel( state ),
	} ),
	( dispatch ) => ( {
		onShowInspector() {
			dispatch( setActivePanel( 'block' ) );
		},
		toggleDefaultSidebar() {
			dispatch( toggleSidebar() );
		},
	} ),
	undefined,
	{ storeKey: 'edit-post' }
)( withSpokenMessages( BlockInspectorButton ) );
