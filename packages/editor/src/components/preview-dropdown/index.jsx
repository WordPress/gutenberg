import clsx from 'clsx';
import { useViewportMatch } from '@wordpress/compose';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { desktop, mobile, tablet } from '@wordpress/icons';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as preferencesStore } from '@wordpress/preferences';
import { ActionItem, store as interfaceStore } from '@wordpress/interface';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { privateApis as globalStylesEnginePrivateApis } from '@wordpress/global-styles-engine';
// eslint-disable-next-line @wordpress/use-recommended-components
import { Menu } from '@wordpress/ui';
import { store as editorStore } from '../../store';
import { PostPreviewMenuItem } from '../post-preview-button';
import MoreMenuItem from '../more-menu/more-menu-item';
import { sidebars } from '../sidebar/constants';
import { VIEWPORT_STATE_BY_DEVICE_TYPE } from '../../utils/device-type';
import { unlock } from '../../lock-unlock';

const { getViewportBreakpoints } = unlock( globalStylesEnginePrivateApis );

export default function PreviewDropdown( { forceIsAutosaveable, disabled } ) {
	const {
		deviceType,
		homeUrl,
		hasMobileViewport,
		hasTabletViewport,
		isTemplate,
		isViewable,
		showIconLabels,
		isTemplateHidden,
		templateId,
		isResponsiveEditing,
		isResponsiveEditingEnabled,
		hasBlockSelection,
		activeComplementaryArea,
	} = useSelect( ( select ) => {
		const {
			getCurrentPostType,
			getCurrentTemplateId,
			getRenderingMode,
			getDeviceType,
			getEditorSettings,
		} = unlock( select( editorStore ) );
		const {
			isResponsiveEditing: _isResponsiveEditing,
			getBlockSelectionStart,
			getSettings,
		} = unlock( select( blockEditorStore ) );
		const { getEntityRecord, getPostType } = select( coreStore );
		const { get } = select( preferencesStore );
		const _currentPostType = getCurrentPostType();
		const viewportBreakpoints = getViewportBreakpoints(
			getSettings().__experimentalFeatures?.viewport
		);
		return {
			deviceType: getDeviceType(),
			homeUrl: getEntityRecord( 'root', '__unstableBase' )?.home,
			hasMobileViewport: viewportBreakpoints.mobile !== undefined,
			hasTabletViewport: viewportBreakpoints.tablet !== undefined,
			isTemplate: _currentPostType === 'wp_template',
			isViewable: getPostType( _currentPostType )?.viewable ?? false,
			showIconLabels: get( 'core', 'showIconLabels' ),
			isTemplateHidden: getRenderingMode() === 'post-only',
			templateId: getCurrentTemplateId(),
			isResponsiveEditing: _isResponsiveEditing(),
			isResponsiveEditingEnabled:
				getEditorSettings().responsiveEditingEnabled,
			hasBlockSelection: !! getBlockSelectionStart(),
			activeComplementaryArea:
				select( interfaceStore ).getActiveComplementaryArea( 'core' ),
		};
	}, [] );
	const { setDeviceType, setRenderingMode, setDefaultRenderingMode } = unlock(
		useDispatch( editorStore )
	);
	const { resetZoomLevel, setStyleStateViewport, setResponsiveEditing } =
		unlock( useDispatch( blockEditorStore ) );
	const { enableComplementaryArea } = useDispatch( interfaceStore );

	const handleDevicePreviewChange = ( newDeviceType ) => {
		setDeviceType( newDeviceType );
		resetZoomLevel();
	};

	const handleResponsiveEditingChange = () => {
		const newIsResponsiveEditing = ! isResponsiveEditing;
		setResponsiveEditing( newIsResponsiveEditing );
		setStyleStateViewport(
			newIsResponsiveEditing
				? VIEWPORT_STATE_BY_DEVICE_TYPE[ deviceType ] ?? 'default'
				: 'default'
		);
		// Only auto-open the block inspector when enabling responsive styles
		// for a selected block and no complementary area is already open.
		if (
			newIsResponsiveEditing &&
			hasBlockSelection &&
			! activeComplementaryArea
		) {
			enableComplementaryArea( 'core', sidebars.block );
		}
	};

	const isMobile = useViewportMatch( 'medium', '<' );
	if ( isMobile ) {
		return null;
	}

	const deviceIcons = {
		desktop,
		mobile,
		tablet,
	};

	/**
	 * The choices for the device type.
	 * Duplicated in block-editor block-visibility constants, and in the edit-site
	 * and boot `viewport` modules. Update all four when adding new viewport types.
	 *
	 * @type {Array}
	 */
	const choices = [
		{
			value: 'Desktop',
			label: __( 'Desktop' ),
			info: isResponsiveEditing
				? __( 'Style all viewports.' )
				: __( 'Preview desktop viewport.' ),
		},
		...( hasTabletViewport
			? [
					{
						value: 'Tablet',
						label: __( 'Tablet' ),
						info: isResponsiveEditing
							? __( 'Style tablet only.' )
							: __( 'Preview tablet viewport.' ),
					},
			  ]
			: [] ),
		...( hasMobileViewport
			? [
					{
						value: 'Mobile',
						label: __( 'Mobile' ),
						info: isResponsiveEditing
							? __( 'Style mobile only.' )
							: __( 'Preview mobile viewport.' ),
					},
			  ]
			: [] ),
	];

	return (
		// The `disabled` prop on `Menu.Root` (rather than on the trigger) keeps
		// the menu from opening while letting the trigger button stay focusable
		// via its own `accessibleWhenDisabled`.
		<Menu.Root modal={ false } disabled={ disabled }>
			<Menu.Trigger
				render={
					<Button
						className={ clsx( 'editor-preview-dropdown__toggle', {
							'is-responsive-editing': isResponsiveEditing,
						} ) }
						size="compact"
						icon={ deviceIcons[ deviceType.toLowerCase() ] }
						label={ __( 'View' ) }
						showTooltip={ ! showIconLabels }
						disabled={ disabled }
						accessibleWhenDisabled={ disabled }
					/>
				}
			/>
			{ /* The menu is named "View" after its trigger. An `aria-label` of
			its own would be ignored, the trigger naming it takes precedence. */ }
			<Menu.Popup
				className="editor-preview-dropdown__popup"
				positioner={ <Menu.Positioner align="end" /> }
			>
				<Menu.RadioGroup
					value={ deviceType }
					onValueChange={ handleDevicePreviewChange }
				>
					<Menu.Group>
						{ choices.map( ( choice ) => (
							<Menu.RadioItem
								key={ choice.value }
								value={ choice.value }
							>
								<Menu.ItemLabel>
									{ choice.label }
								</Menu.ItemLabel>
								<Menu.ItemDescription>
									{ choice.info }
								</Menu.ItemDescription>
							</Menu.RadioItem>
						) ) }
					</Menu.Group>
				</Menu.RadioGroup>
				{ isResponsiveEditingEnabled && (
					<>
						<Menu.Separator />
						<Menu.CheckboxItem
							checked={ isResponsiveEditing }
							onClick={ handleResponsiveEditingChange }
						>
							<Menu.ItemLabel>
								{ __( 'Responsive styles' ) }
							</Menu.ItemLabel>
							<Menu.ItemDescription>
								{ __(
									'Style changes apply only to the selected viewport.'
								) }
							</Menu.ItemDescription>
						</Menu.CheckboxItem>
					</>
				) }
				{ isTemplate && (
					<>
						<Menu.Separator />
						<Menu.LinkItem
							href={ homeUrl }
							openInNewTab
							closeOnClick
						>
							<Menu.ItemLabel>
								{ __( 'View site' ) }
							</Menu.ItemLabel>
						</Menu.LinkItem>
					</>
				) }
				{ ! isTemplate && !! templateId && (
					<>
						<Menu.Separator />
						<Menu.CheckboxItem
							checked={ ! isTemplateHidden }
							onClick={ () => {
								const newRenderingMode = isTemplateHidden
									? 'template-locked'
									: 'post-only';
								setRenderingMode( newRenderingMode );
								setDefaultRenderingMode( newRenderingMode );
								resetZoomLevel();
							} }
						>
							<Menu.ItemLabel>
								{ __( 'Show template' ) }
							</Menu.ItemLabel>
						</Menu.CheckboxItem>
					</>
				) }
				{ isViewable && (
					<>
						<Menu.Separator />
						<PostPreviewMenuItem
							forceIsAutosaveable={ forceIsAutosaveable }
						/>
					</>
				) }
				<ActionItem.Slot
					name="core/plugin-preview-menu"
					fillProps={ { as: MoreMenuItem } }
				>
					{ ( items ) => (
						<>
							<Menu.Separator />
							<Menu.Group>{ items }</Menu.Group>
						</>
					) }
				</ActionItem.Slot>
			</Menu.Popup>
		</Menu.Root>
	);
}
