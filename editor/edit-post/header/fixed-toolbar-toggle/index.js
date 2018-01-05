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
			label={ __( 'Toolbar' ) }
		>
			<MenuItemsToggle
				label={ __( 'Fix toolbar to block' ) }
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
	} )
)( withInstanceId( FeatureToggle ) );
