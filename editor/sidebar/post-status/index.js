/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { PanelBody, PanelRow, FormToggle, withInstanceId } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import PostVisibility from '../post-visibility';
import PostTrash from '../post-trash';
import PostSchedule from '../post-schedule';
import PostSticky from '../post-sticky';
import PostAuthor from '../post-author';
import PostFormat from '../post-format';
import {
	getEditedPostAttribute,
	isCurrentPostPublished,
	isEditorSidebarPanelOpened,
} from '../../selectors';
import { editPost, toggleSidebarPanel } from '../../actions';

/**
 * Module Constants
 */
const PANEL_NAME = 'post-status';

class PostStatus extends Component {
	constructor() {
		super( ...arguments );
		this.togglePendingStatus = this.togglePendingStatus.bind( this );
		this.togglePanel = this.togglePanel.bind( this );
	}

	togglePendingStatus() {
		const { status, onUpdateStatus } = this.props;
		const updatedStatus = status === 'pending' ? 'draft' : 'pending';
		onUpdateStatus( updatedStatus );
	}

	togglePanel() {
		this.props.toggleSidebarPanel( PANEL_NAME );
	}

	render() {
		const { status, isPublished, isOpened, instanceId } = this.props;
		const pendingId = 'pending-toggle-' + instanceId;

		return (
			<PanelBody title={ __( 'Status & Visibility' ) } opened={ isOpened } onToggle={ this.togglePanel }>
				{ ! isPublished &&
					<PanelRow>
						<label htmlFor={ pendingId }>{ __( 'Pending review' ) }</label>
						<FormToggle
							id={ pendingId }
							checked={ status === 'pending' }
							onChange={ this.togglePendingStatus }
							showHint={ false }
						/>
					</PanelRow>
				}
				<PostVisibility />
				<PostSchedule />
				<PostFormat />
				<PostSticky />
				<PostAuthor />
				<PostTrash />
			</PanelBody>
		);
	}
}

export default connect(
	( state ) => ( {
		status: getEditedPostAttribute( state, 'status' ),
		isPublished: isCurrentPostPublished( state ),
		isOpened: isEditorSidebarPanelOpened( state, PANEL_NAME ),
	} ),
	{
		onUpdateStatus( status ) {
			return editPost( { status } );
		},
		toggleSidebarPanel,
	}
)( withInstanceId( PostStatus ) );

