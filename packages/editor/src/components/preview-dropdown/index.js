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
	const isZoomOutExperiment =
		!! window.__experimentalEnableZoomedOutPatternsTab;

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
			// We need to use  __unstableGetEditorMode() here and not `mode`, as mode may not update on unmount
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
		size: 'compact',
		showTooltip: ! showIconLabels,
		disabled,
		accessibleWhenDisabled: disabled,
	};
	const menuProps = {
		'aria-label': __( 'View options' ),
	};

	const deviceIcons = {
		mobile,
		tablet,
		desktop,
	};

	/**
	 * The choices for the device type.
	 *
	 * @type {Array}
	 */
	const choices = [
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

	if ( isZoomOutExperiment ) {
		choices.unshift( {
			value: 'ZoomOut',
			label: __( 'Zoom to 50%' ),
			icon: <p>{ __( '50%' ) }</p>,
		} );
		choices.unshift( {
			value: 'ZoomIn',
			label: __( 'Zoom to 100%' ),
			icon: <p>{ __( '100%' ) }</p>,
		} );
	} else {
		choices.unshift( {
			value: 'Desktop',
			label: __( 'Desktop' ),
			icon: desktop,
		} );
	}

	/**
	 * The selected choice.
	 *
	 * @type {Object}
	 */
	let selectedChoice = choices.find(
		( choice ) => choice.value === deviceType
	);

	/**
	 * If no selected choice is found, default to the first
	 */
	if ( ! selectedChoice ) {
		selectedChoice = choices[ 0 ];
	}

	/**
	 * Handles the selection of a device type.
	 *
	 * @param {string} value The device type.
	 */
	const onSelect = ( value ) => {
		setDeviceType( value );
		let newEditorMode = originalEditingMode.current;
		if ( value === 'Desktop' ) {
			speak( __( 'Desktop selected' ), 'assertive' );
		} else if ( value === 'Tablet' ) {
			speak( __( 'Tablet selected' ), 'assertive' );
		} else if ( value === 'Mobile' ) {
			speak( __( 'Mobile selected' ), 'assertive' );
		} else if ( value === 'ZoomIn' ) {
			speak( __( 'Zoom to 100 percent selected' ), 'assertive' );
		} else {
			speak( __( 'Zoom to 50 percent selected' ), 'assertive' );
			newEditorMode = 'zoom-out';
		}

		if ( isZoomOutExperiment ) {
			__unstableSetEditorMode( newEditorMode );
		}
	};

	const getIcon = () => {
		if (
			isZoomOutExperiment &&
			deviceType !== 'Mobile' &&
			deviceType !== 'Tablet'
		) {
			if ( editorMode === 'zoom-out' ) {
				return <>{ __( '50%' ) }</>;
			}
			return <>{ __( '100%' ) }</>;
		}

		return deviceIcons[ deviceType.toLowerCase() ];
	};

	return (
		<DropdownMenu
			className="editor-preview-dropdown"
			popoverProps={ popoverProps }
			toggleProps={ toggleProps }
			menuProps={ menuProps }
			icon={ getIcon() }
			label={ __( 'View' ) }
			disableOpenOnArrowDown={ disabled }
		>
			{ ( { onClose } ) => (
				<>
					<MenuGroup>
						<MenuItemsChoice
							choices={ choices }
							value={ selectedChoice.value }
							onSelect={ setDeviceType }
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
