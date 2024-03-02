/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { MenuGroup } from '@wordpress/components';
import {
	ActionItem,
	MoreMenuDropdown,
	PinnedItems,
} from '@wordpress/interface';
import { useViewportMatch } from '@wordpress/compose';
import { privateApis as editorPrivateApis } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import PreferencesMenuItem from '../preferences-menu-item';
import ToolsMoreMenuGroup from '../tools-more-menu-group';
import WritingMenu from '../writing-menu';
import { unlock } from '../../../lock-unlock';

const { ModeSwitcher } = unlock( editorPrivateApis );

const MoreMenu = ( { showIconLabels } ) => {
	const isLargeViewport = useViewportMatch( 'large' );

	return (
		<MoreMenuDropdown
			toggleProps={ {
				showTooltip: ! showIconLabels,
				...( showIconLabels && { variant: 'tertiary' } ),
				size: 'compact',
			} }
		>
			{ ( { onClose } ) => (
				<>
					{ showIconLabels && ! isLargeViewport && (
						<PinnedItems.Slot
							className={ showIconLabels && 'show-icon-labels' }
							scope="core/edit-post"
						/>
					) }
					<WritingMenu />
					<ModeSwitcher />
					<ActionItem.Slot
						name="core/edit-post/plugin-more-menu"
						label={ __( 'Plugins' ) }
						as={ MenuGroup }
						fillProps={ { onClick: onClose } }
					/>
					<ToolsMoreMenuGroup.Slot fillProps={ { onClose } } />
					<MenuGroup>
						<PreferencesMenuItem />
					</MenuGroup>
				</>
			) }
		</MoreMenuDropdown>
	);
};

export default MoreMenu;
