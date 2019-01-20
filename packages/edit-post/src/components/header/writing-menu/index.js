/**
 * WordPress Dependencies
 */
import { MenuGroup } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { ifViewportMatches } from '@wordpress/viewport';

/**
 * Internal dependencies
 */
import FeatureToggle from '../feature-toggle';

function WritingMenu( { onClose } ) {
	return (
		<MenuGroup
			label={ _x( 'View', 'noun' ) }
		>
			<FeatureToggle
				feature="fixedToolbar"
				label={ __( 'Top Toolbar' ) }
				info={ __( 'Access all block and document tools in a single place' ) }
				onToggle={ onClose }
				messages={ {
					activated: __( 'Top toolbar activated' ),
					deactivated: __( 'Top toolbar deactivated' ),
				} }
			/>
			<FeatureToggle
				feature="focusMode"
				label={ __( 'Spotlight Mode' ) }
				info={ __( 'Focus on one block at a time' ) }
				onToggle={ onClose }
				messages={ {
					activated: __( 'Spotlight mode activated' ),
					deactivated: __( 'Spotlight mode deactivated' ),
				} }
			/>
			<FeatureToggle
				feature="fullscreenMode"
				label={ __( 'Fullscreen Mode' ) }
				info={ __( 'Work without distraction' ) }
				onToggle={ onClose }
				messages={ {
					activated: __( 'Fullscreen mode activated' ),
					deactivated: __( 'Fullscreen mode deactivated' ),
				} }
			/>
		</MenuGroup>
	);
}

export default ifViewportMatches( 'medium' )( WritingMenu );
