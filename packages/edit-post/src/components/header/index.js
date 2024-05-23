/**
 * WordPress dependencies
 */
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { useSelect } from '@wordpress/data';
import { __unstableMotion as motion } from '@wordpress/components';

/**
 * Internal dependencies
 */
import FullscreenModeClose from './fullscreen-mode-close';
import PostEditorMoreMenu from './more-menu';
import MainDashboardButton from './main-dashboard-button';
import { store as editPostStore } from '../../store';
import { unlock } from '../../lock-unlock';

const { Header: EditorHeader } = unlock( editorPrivateApis );

const slideX = {
	hidden: { x: '-100%' },
	distractionFreeInactive: { x: 0 },
	hover: { x: 0, transition: { type: 'tween', delay: 0.2 } },
};

function Header( { setEntitiesSavedStatesCallback, initialPost } ) {
	const { hasActiveMetaboxes } = useSelect( ( select ) => {
		return {
			hasActiveMetaboxes: select( editPostStore ).hasMetaBoxes(),
		};
	}, [] );

	return (
		<EditorHeader
			forceIsDirty={ hasActiveMetaboxes }
			setEntitiesSavedStatesCallback={ setEntitiesSavedStatesCallback }
		>
			<MainDashboardButton.Slot>
				<motion.div
					variants={ slideX }
					transition={ { type: 'tween', delay: 0.8 } }
				>
					<FullscreenModeClose
						showTooltip
						initialPost={ initialPost }
					/>
				</motion.div>
			</MainDashboardButton.Slot>
			<PostEditorMoreMenu />
		</EditorHeader>
	);
}

export default Header;
