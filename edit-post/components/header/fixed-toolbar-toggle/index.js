/**
 * External Dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { MenuItemsGroup, MenuItemsToggle, withInstanceId } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import { hasFixedToolbar, isMobile } from '../../../store/selectors';
import { toggleFeature } from '../../../store/actions';

function FeatureToggle( { onToggle, active, onMobile } ) {
	if ( onMobile ) {
		return null;
	}
	return (
		<MenuItemsGroup
			label={ __( 'Settings' ) }
		>
			<MenuItemsToggle
				label={ __( 'Fix Toolbar to Top' ) }
				isSelected={ active }
				onClick={ onToggle }
			/>
		</MenuItemsGroup>
	);
}

export default connect(
	( state ) => ( {
		active: hasFixedToolbar( state ),
		onMobile: isMobile( state ),
	} ),
	( dispatch, ownProps ) => ( {
		onToggle() {
			dispatch( toggleFeature( 'fixedToolbar' ) );
			ownProps.onToggle();
		},
	} ),
	undefined,
	{ storeKey: 'edit-post' }
)( withInstanceId( FeatureToggle ) );
