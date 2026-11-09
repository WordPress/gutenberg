import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { __unstableMotion as motion } from '@wordpress/components';
import { store as preferencesStore } from '@wordpress/preferences';
import { useSelect } from '@wordpress/data';
import FullscreenModeClose from './fullscreen-mode-close';
import { unlock } from '../../lock-unlock';

const { BackButton: BackButtonFill } = unlock( editorPrivateApis );

const slideX = {
	hidden: { x: '-100%' },
	distractionFreeInactive: { x: 0 },
	hover: { x: 0, transition: { type: 'tween', delay: 0.2 } },
};

function BackButton( { initialPost } ) {
	const showIconLabels = useSelect( ( select ) => {
		return select( preferencesStore ).get( 'core', 'showIconLabels' );
	}, [] );

	// The admin menu stays in view as a rail, and leads back to the admin.
	if ( window.__experimentalAdminNavigationRail ) {
		return null;
	}

	return (
		<BackButtonFill>
			{ ( { length } ) =>
				length <= 1 && (
					<motion.div
						variants={ slideX }
						transition={ { type: 'tween', delay: 0.8 } }
					>
						<FullscreenModeClose
							showTooltip={ ! showIconLabels }
							initialPost={ initialPost }
						/>
					</motion.div>
				)
			}
		</BackButtonFill>
	);
}

export default BackButton;
