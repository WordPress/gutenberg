/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody, PanelRow, FormToggle } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import { collaborationMode } from '../../../actions';

function CollaborationPanel( { active = false, ...props } ) {
	const changeMode = () => props.collaborationMode( ! active );

	return (
		<PanelBody title={ __( 'Collaboration' ) } initialOpen={ false }>
			<PanelRow>
				<label htmlFor="grtc-middleware">{ __( 'Enable Collaboration' ) }</label>
				<FormToggle
					checked={ active }
					onChange={ changeMode }
					showHint={ false }
					id="grtc-middleware"
				/>
			</PanelRow>
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
