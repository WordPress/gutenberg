/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import {
	PostPreviewButton,
	PostSavedState,
	PostPublishPanelToggle,
} from '../../components';
import EllipsisMenu from './ellipsis-menu';
import HeaderToolbar from './header-toolbar';
import {
	getOpenedGeneralSidebar,
	isPublishSidebarOpened,
} from '../../store/selectors';
import {
	openGeneralSidebar,
	closeGeneralSidebar,
	togglePublishSidebar
} from '../../store/actions';

function Header( { isGeneralSidebarOpened, onOpenGeneralSidebar, onCloseGeneralSidebar, onTogglePublishSidebar } ) {
	const toggleGeneralSidebar = isGeneralSidebarOpened ? onCloseGeneralSidebar : onOpenGeneralSidebar;
	return (
		<div
			role="region"
			aria-label={ __( 'Editor toolbar' ) }
			className="editor-header"
			tabIndex="-1"
		>
			<HeaderToolbar />
			{ ! isPublishSidebarOpened && (
				<div className="editor-header__settings">
					<PostSavedState />
					<PostPreviewButton />
					<PostPublishPanelToggle
						isOpen={ isPublishSidebarOpened }
						onToggle={ onTogglePublishSidebar }
					/>
					<IconButton
						icon="admin-generic"
						onClick={ toggleGeneralSidebar }
						isToggled={ isGeneralSidebarOpened }
						label={ __( 'Settings' ) }
						aria-expanded={ isGeneralSidebarOpened }
					/>
					<EllipsisMenu key="ellipsis-menu" />
				</div>
			) }
		</div>
	);
}

export default connect(
	( state ) => ( {
		isGeneralSidebarOpened: !! getOpenedGeneralSidebar( state ),
		isPublishSidebarOpened: isPublishSidebarOpened( state ),
	} ),
	{
		onOpenGeneralSidebar: () => openGeneralSidebar( 'editor' ),
		onCloseGeneralSidebar: closeGeneralSidebar,
		onTogglePublishSidebar: togglePublishSidebar,
	},
)( Header );
