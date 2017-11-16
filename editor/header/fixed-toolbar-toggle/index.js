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
import { isFeatureActive } from '../../state/selectors';
import { toggleFeature } from '../../state/actions';

function FeatureToggle( { onToggle, active } ) {
	return (
		<IconButton
			className="editor-fixed-toolbar-toggle"
			icon="editor-kitchensink"
			onClick={ () => {
				onToggle();
			} }
		>
			{ active ? __( 'Fix toolbar to block' ) : __( 'Fix toolbar to top' ) }
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
