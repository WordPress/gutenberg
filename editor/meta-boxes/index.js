/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { Panel, PanelBody, Dashicon } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import { isEditorExtendedSettingsOpened, isEditorSidebarOpened } from '../selectors';
import { toggleExtendedSettings } from '../actions';

class MetaBoxes extends Component {

	componentWillReceiveProps( nextProps ) {
		const { toggle } = this.props;

		// if sidebar state changes
		if ( nextProps.isEditorSidebarOpened !== this.props.isEditorSidebarOpened ) {
			// and sidebar state is set to closed and extended settings is open ensure extended settings is closed too
			if ( ! nextProps.isEditorSidebarOpened && this.props.isExtendedSettingsOpened ) {
				toggle();
			}
		}
	}

	render() {
		const { isExtendedSettingsOpened, toggle } = this.props;

		return (
			<Panel className="editor-meta-boxes">
				<PanelBody
					title={ __( 'Extended Settings' ) }
					opened={ isExtendedSettingsOpened }
					onToggle={ () => toggle() }>
					<div className="editor-meta-boxes__coming-soon">
						<Dashicon icon="flag" />
						<h3>{ __( 'Coming Soon' ) }</h3>
						<p>{ __( 'Meta boxes are not yet supported, but are planned for a future release.' ) }</p>
					</div>
				</PanelBody>
			</Panel>
		);
	}
}

export default connect(
	( state ) => ( {
		isExtendedSettingsOpened: isEditorExtendedSettingsOpened( state ),
		isEditorSidebarOpened: isEditorSidebarOpened( state ),
	} ),
	( dispatch ) => ( {
		toggle: () => dispatch( toggleExtendedSettings() ),
	} )
)( MetaBoxes );
