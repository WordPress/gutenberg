/**
 * WordPress dependencies
 */
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { __unstableMotion as motion } from '@wordpress/components';

/**
 * Internal dependencies
 */
import FullscreenModeClose from './fullscreen-mode-close';
import { unlock } from '../../lock-unlock';

const { BackButton: BackButtonFill } = unlock( editorPrivateApis );

const slideX = {
	hidden: { x: '-100%' },
	distractionFreeInactive: { x: 0 },
	hover: { x: 0, transition: { type: 'tween', delay: 0.2 } },
};

function BackButton( { initialPost } ) {
	return (
		<BackButtonFill>
			<motion.div
				variants={ slideX }
				transition={ { type: 'tween', delay: 0.8 } }
			>
				<FullscreenModeClose showTooltip initialPost={ initialPost } />
			</motion.div>
		</BackButtonFill>
	);
}

export default BackButton;
