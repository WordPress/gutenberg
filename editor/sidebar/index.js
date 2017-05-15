/**
 * External dependencies
 */
import { Slot } from 'react-slot-fill';
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import Panel from 'components/panel';
import PanelHeader from 'components/panel-header';
import PanelBody from 'components/panel-body';
import IconButton from 'components/icon-button';

/**
 * Internal Dependencies
 */
import './style.scss';

const Sidebar = ( { toggleSidebar } ) => {
	return (
		<div className="editor-sidebar">
			<Panel>
				<PanelHeader>
					<strong>{ __( 'Post Settings' ) }</strong>
					<IconButton
						onClick={ toggleSidebar }
						icon="no-alt"
					/>
				</PanelHeader>
				<PanelBody />
			</Panel>
			<Panel>
				<PanelHeader>
					<strong>
						<span className="editor-sidebar__select-post">Post</span> → Block
					</strong>
					<IconButton
						onClick={ toggleSidebar }
						icon="no-alt"
					/>
				</PanelHeader>
				<PanelBody>
					<Slot name="Sidebar.Inspector" />
				</PanelBody>
			</Panel>
		</div>
	);
};

export default connect(
	undefined,
	( dispatch ) => ( {
		toggleSidebar: () => dispatch( { type: 'TOGGLE_SIDEBAR' } ),
	} )
)( Sidebar );
