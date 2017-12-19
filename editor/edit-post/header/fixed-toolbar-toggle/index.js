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
import { isFeatureActive } from '../../../store/selectors';
import { toggleFeature } from '../../../store/actions';

function FeatureToggle( { onToggle, active } ) {
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
		active: ! isFeatureActive( state, 'fixedToolbar' ),
	} ),
	( dispatch, ownProps ) => ( {
		onToggle() {
			dispatch( toggleFeature( 'fixedToolbar' ) );
			ownProps.onToggle();
		},
	} )
)( withInstanceId( FeatureToggle ) );
