/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton } from '@wordpress/components';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
import {
	PostPreviewButton,
	PostSavedState,
	PostPublishPanelToggle,
	PostPublishPanel,
} from '../../components';
import EllipsisMenu from './ellipsis-menu';
import HeaderToolbar from './header-toolbar';
import { isEditorSidebarOpened } from '../../store/selectors';
import { toggleSidebar } from '../../store/actions';

class Header extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			isPublishPanelOpened: false,
		};
		this.togglePublishPanel = this.togglePublishPanel.bind( this );
		this.closePublishPanel = this.closePublishPanel.bind( this );
	}

	togglePublishPanel() {
		this.setState( ( state ) => ( {
			isPublishPanelOpened: ! state.isPublishPanelOpened,
		} ) );
	}

	closePublishPanel() {
		this.setState( {
			isPublishPanelOpened: false,
		} );
	}

	render() {
		const { onToggleSidebar, isSidebarOpened } = this.props;
		return (
			<div
				role="region"
				aria-label={ __( 'Editor toolbar' ) }
				className="editor-header"
				tabIndex="-1"
			>
				<HeaderToolbar />
				<div className="editor-header__settings">
					{ ! this.state.isPublishPanelOpened && [
						<PostSavedState key="saved-state" />,
						<PostPreviewButton key="preview-button" />,
						<PostPublishPanelToggle
							key="publish-button"
							isOpen={ this.state.isPublishPanelOpened }
							onToggle={ this.togglePublishPanel }
						/>,
						<IconButton
							key="sidebar-toggle"
							icon="admin-generic"
							onClick={ onToggleSidebar }
							isToggled={ isSidebarOpened }
							label={ __( 'Settings' ) }
							aria-expanded={ isSidebarOpened }
						/>,
						<EllipsisMenu key="ellipsis-menu" />,
					] }

					{ this.state.isPublishPanelOpened && <PostPublishPanel onClose={ this.closePublishPanel } /> }
				</div>
			</div>
		);
	}
}

export default connect(
	( state ) => ( {
		isSidebarOpened: isEditorSidebarOpened( state ),
	} ),
	( dispatch ) => ( {
		onToggleSidebar: () => dispatch( toggleSidebar() ),
	} )
)( Header );
