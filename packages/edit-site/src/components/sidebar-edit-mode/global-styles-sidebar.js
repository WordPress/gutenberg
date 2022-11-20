/**
 * WordPress dependencies
 */
import { DropdownMenu, FlexItem, FlexBlock, Flex } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { styles, moreVertical } from '@wordpress/icons';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import DefaultSidebar from './default-sidebar';
import { GlobalStylesUI, useGlobalStylesReset } from '../global-styles';

export default function GlobalStylesSidebar() {
	const [ canReset, onReset ] = useGlobalStylesReset();
	const { toggle } = useDispatch( preferencesStore );
	const {
		__unstableSetEditorMode,
		__unstableSetGlobalStylesPreviewPageVisibility,
	} = useDispatch( blockEditorStore );
	const { isZoomOutMode, isGlobalStylesPreviewPageVisible } = useSelect(
		( select ) => {
			const {
				__unstableGetEditorMode,
				__unstableIsGlobalStylesPreviewPageVisible,
			} = select( blockEditorStore );

			return {
				isZoomOutMode: __unstableGetEditorMode() === 'zoom-out',
				isGlobalStylesPreviewPageVisible:
					__unstableIsGlobalStylesPreviewPageVisible() === true,
			};
		},
		[]
	);
	return (
		<DefaultSidebar
			className="edit-site-global-styles-sidebar"
			identifier="edit-site/global-styles"
			title={ __( 'Styles' ) }
			icon={ styles }
			closeLabel={ __( 'Close global styles sidebar' ) }
			panelClassName="edit-site-global-styles-sidebar__panel"
			header={
				<Flex>
					<FlexBlock>
						<strong>{ __( 'Styles' ) }</strong>
					</FlexBlock>
					<FlexItem>
						<DropdownMenu
							icon={ moreVertical }
							label={ __( 'More Global Styles Actions' ) }
							controls={ [
								{
									title: __( 'Reset to defaults' ),
									onClick: onReset,
									isDisabled: ! canReset,
								},
								{
									title: isZoomOutMode
										? __(
												'Hide Global Styles Preview Page'
										  )
										: __(
												'Show Global Styles Preview Page'
										  ),
									onClick: () => {
										__unstableSetGlobalStylesPreviewPageVisibility(
											! isGlobalStylesPreviewPageVisible
										);
										__unstableSetEditorMode(
											isZoomOutMode ? 'edit' : 'zoom-out'
										);
									},
								},
								{
									title: __( 'Welcome Guide' ),
									onClick: () =>
										toggle(
											'core/edit-site',
											'welcomeGuideStyles'
										),
								},
							] }
						/>
					</FlexItem>
				</Flex>
			}
		>
			<GlobalStylesUI />
		</DefaultSidebar>
	);
}
