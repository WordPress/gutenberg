/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useViewportMatch } from '@wordpress/compose';
import {
	DropdownMenu,
	MenuGroup,
	MenuItem,
	MenuItemsChoice,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { desktop, mobile, tablet, external, check } from '@wordpress/icons';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as preferencesStore } from '@wordpress/preferences';
import { ActionItem } from '@wordpress/interface';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { privateApis as globalStylesEnginePrivateApis } from '@wordpress/global-styles-engine';
import { VisuallyHidden } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { PostPreviewMenuItem } from '../post-preview-button';
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
	} = useSelect( ( select ) => {
		const {
			getCurrentPostType,
			getCurrentTemplateId,
			getRenderingMode,
			getDeviceType,
		} = unlock( select( editorStore ) );
		const { isResponsiveEditing: _isResponsiveEditing } = unlock(
			select( blockEditorStore )
		);
		const blockEditorSettings = select( blockEditorStore ).getSettings();
		const { getEntityRecord, getPostType } = select( coreStore );
		const { get } = select( preferencesStore );
		const _currentPostType = getCurrentPostType();
		const viewportBreakpoints = getViewportBreakpoints(
			blockEditorSettings.__experimentalFeatures?.viewport
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
		};
	}, [] );
	const { setDeviceType, setRenderingMode, setDefaultRenderingMode } = unlock(
		useDispatch( editorStore )
	);
	const { resetZoomLevel, setStyleStateViewport, setResponsiveEditing } =
		unlock( useDispatch( blockEditorStore ) );

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
	};

	const isMobile = useViewportMatch( 'medium', '<' );
	if ( isMobile ) {
		return null;
	}

	const popoverProps = {
		placement: 'bottom-end',
	};
	const toggleProps = {
		className: 'editor-preview-dropdown__toggle',
		iconPosition: 'right',
		size: 'compact',
		showTooltip: ! showIconLabels,
		disabled,
		accessibleWhenDisabled: disabled,
	};
	const menuProps = {
		'aria-label': __( 'View options' ),
	};

	const deviceIcons = {
		desktop,
		mobile,
		tablet,
	};

	/**
	 * The choices for the device type.
	 * Duplicated in block-editor block-visibility constants and edit-site
	 * use-viewport-sync. Update all three when adding new viewport types.
	 *
	 * @type {Array}
	 */
	const choices = [
		{
			value: 'Desktop',
			label: __( 'Desktop' ),
			icon: desktop,
			info: isResponsiveEditing
				? __( 'Style all viewports.' )
				: __( 'Preview desktop viewport.' ),
		},
		...( hasTabletViewport
			? [
					{
						value: 'Tablet',
						label: __( 'Tablet' ),
						icon: tablet,
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
						icon: mobile,
						info: isResponsiveEditing
							? __( 'Style mobile only.' )
							: __( 'Preview mobile viewport.' ),
					},
			  ]
			: [] ),
	];

	return (
		<DropdownMenu
			className={ clsx(
				'editor-preview-dropdown',
				`editor-preview-dropdown--${ deviceType.toLowerCase() }`
			) }
			popoverProps={ popoverProps }
			toggleProps={ toggleProps }
			menuProps={ menuProps }
			icon={ deviceIcons[ deviceType.toLowerCase() ] }
			label={ __( 'View' ) }
			disableOpenOnArrowDown={ disabled }
		>
			{ ( { onClose } ) => (
				<>
					<MenuGroup>
						<MenuItemsChoice
							choices={ choices }
							value={ deviceType }
							onSelect={ handleDevicePreviewChange }
						/>
					</MenuGroup>
					<MenuGroup>
						<MenuItem
							icon={ isResponsiveEditing ? check : undefined }
							isSelected={ isResponsiveEditing }
							role="menuitemcheckbox"
							onClick={ handleResponsiveEditingChange }
							info={ __(
								'Style changes apply only to the selected viewport.'
							) }
						>
							{ __( 'Responsive styles' ) }
						</MenuItem>
					</MenuGroup>
					{ isTemplate && (
						<MenuGroup>
							<MenuItem
								href={ homeUrl }
								target="_blank"
								icon={ external }
								onClick={ onClose }
							>
								{ __( 'View site' ) }
								<VisuallyHidden render={ <span /> }>
									{
										/* translators: accessibility text */
										__( '(opens in a new tab)' )
									}
								</VisuallyHidden>
							</MenuItem>
						</MenuGroup>
					) }
					{ ! isTemplate && !! templateId && (
						<MenuGroup>
							<MenuItem
								icon={ ! isTemplateHidden ? check : undefined }
								isSelected={ ! isTemplateHidden }
								role="menuitemcheckbox"
								onClick={ () => {
									const newRenderingMode = isTemplateHidden
										? 'template-locked'
										: 'post-only';
									setRenderingMode( newRenderingMode );
									setDefaultRenderingMode( newRenderingMode );
									resetZoomLevel();
								} }
							>
								{ __( 'Show template' ) }
							</MenuItem>
						</MenuGroup>
					) }
					{ isViewable && (
						<MenuGroup>
							<PostPreviewMenuItem
								forceIsAutosaveable={ forceIsAutosaveable }
								onPreview={ onClose }
							/>
						</MenuGroup>
					) }
					<ActionItem.Slot
						name="core/plugin-preview-menu"
						fillProps={ { onClick: onClose } }
					/>
				</>
			) }
		</DropdownMenu>
	);
}
