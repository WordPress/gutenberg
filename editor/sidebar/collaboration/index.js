/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import { PanelBody, FormToggle } from 'components';

/**
 * Internal Dependencies
 */
import './style.scss';
import { collaborationMode } from '../../actions';

function CollaborationPanel( { active = false, ...props } ) {
	const changeMode = () => props.collaborationMode( ! active );

	return (
		<PanelBody title={ __( 'Collaboration' ) } initialOpen={ false }>
			<div className="editor-discussion-panel__row">
				<label>{ __( 'Enable Collaboration' ) }</label>
				<FormToggle
					checked={ active }
					onChange={ changeMode }
					id="collaboration-toggle"
				/>
			</div>
		</PanelBody>
	);
}

export default connect(
	( state ) => {
		return {
			active: state.collaborationMode.active,
		};
	},
	{ collaborationMode }
)( CollaborationPanel );
