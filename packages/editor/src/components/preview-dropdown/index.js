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
	VisuallyHidden,
	Icon,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { desktop, mobile, tablet, external } from '@wordpress/icons';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useEffect, useRef } from '@wordpress/element';
import { store as preferencesStore } from '@wordpress/preferences';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import PostPreviewButton from '../post-preview-button';

export default function PreviewDropdown( { forceIsAutosaveable, disabled } ) {
	const {
		deviceType,
		editorMode,
		homeUrl,
		isTemplate,
		isViewable,
		showIconLabels,
	} = useSelect( ( select ) => {
		const { getDeviceType, getCurrentPostType } = select( editorStore );
		const { getUnstableBase, getPostType } = select( coreStore );
		const { get } = select( preferencesStore );
		const { __unstableGetEditorMode } = select( blockEditorStore );
		const _currentPostType = getCurrentPostType();
		return {
			deviceType: getDeviceType(),
			editorMode: __unstableGetEditorMode(),
			homeUrl: getUnstableBase()?.home,
			isTemplate: _currentPostType === 'wp_template',
			isViewable: getPostType( _currentPostType )?.viewable ?? false,
			showIconLabels: get( 'core', 'showIconLabels' ),
		};
	}, [] );
	const { setDeviceType } = useDispatch( editorStore );
	const { __unstableSetEditorMode } = useDispatch( blockEditorStore );

	/**
	 * Save the original editing mode in a ref to restore it when we exit zoom out.
	 */
	const originalEditingMode = useRef( editorMode );
	useEffect( () => {
		if ( editorMode !== 'zoom-out' ) {
			originalEditingMode.current = editorMode;
		}

		return () => {
			if (
				editorMode === 'zoom-out' &&
				editorMode !== originalEditingMode.current
			) {
				__unstableSetEditorMode( originalEditingMode.current );
			}
		};
	}, [ editorMode, __unstableSetEditorMode ] );

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
	 *
	 * @type {Array}
	 */
	const choices = [
		{
			value: 'Desktop',
			label: __( 'Desktop' ),
			icon: desktop,
		},
		{
			value: 'ZoomOut',
			label: __( 'Desktop (50%)' ),
			icon: desktop,
		},
		{
			value: 'Tablet',
			label: __( 'Tablet' ),
			icon: tablet,
		},
		{
			value: 'Mobile',
			label: __( 'Mobile' ),
			icon: mobile,
		},
	];

	const previewValue = editorMode === 'zoom-out' ? 'ZoomOut' : deviceType;

	/**
	 * Handles the selection of a device type.
	 *
	 * @param {string} value The device type.
	 */
	const onSelect = ( value ) => {
		let newEditorMode = originalEditingMode.current;

		if ( value === 'ZoomOut' ) {
			newEditorMode = 'zoom-out';
			setDeviceType( 'Desktop' );
		} else {
			setDeviceType( value );
		}

		__unstableSetEditorMode( newEditorMode );
	};

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
			text={ editorMode === 'zoom-out' ? __( '50%' ) : undefined }
			label={ __( 'View' ) }
			disableOpenOnArrowDown={ disabled }
		>
			{ ( { onClose } ) => (
				<>
					<MenuGroup>
						<MenuItemsChoice
							choices={ choices }
							value={ previewValue }
							onSelect={ onSelect }
						/>
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
								<VisuallyHidden as="span">
									{
										/* translators: accessibility text */
										__( '(opens in a new tab)' )
									}
								</VisuallyHidden>
							</MenuItem>
						</MenuGroup>
					) }
					{ isViewable && (
						<MenuGroup>
							<PostPreviewButton
								className="editor-preview-dropdown__button-external"
								role="menuitem"
								forceIsAutosaveable={ forceIsAutosaveable }
								aria-label={ __( 'Preview in new tab' ) }
								textContent={
									<>
										{ __( 'Preview in new tab' ) }
										<Icon icon={ external } />
									</>
								}
								onPreview={ onClose }
							/>
						</MenuGroup>
					) }
				</>
			) }
		</DropdownMenu>
	);
}
