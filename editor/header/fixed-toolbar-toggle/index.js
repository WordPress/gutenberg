/**
 * External Dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton, withInstanceId } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import './style.scss';
import { isFeatureActive } from '../../selectors';
import { toggleFeature } from '../../actions';

function FeatureToggle( { onToggle, active } ) {
	return (
		<IconButton
			className="editor-fixed-toolbar-toggle"
			icon={ active ? 'yes' : 'no' }
			onClick={ () => {
				onToggle();
			} }
		>
			{ __( 'Fixed Block Toolbar' ) }
		</IconButton>
	);
}

export default connect(
	( state ) => ( {
		active: isFeatureActive( state, 'fixedToolbar' ),
	} ),
	( dispatch, ownProps ) => ( {
		onToggle() {
			dispatch( toggleFeature( 'fixedToolbar' ) );
			ownProps.onToggle();
		},
	} )
)( withInstanceId( FeatureToggle ) );
