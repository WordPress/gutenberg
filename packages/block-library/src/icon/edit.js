/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	DropdownMenu,
	Popover,
	TextControl,
	ToolbarButton,
	ToolbarGroup,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import {
	BlockControls,
	InspectorControls,
	useBlockProps,
	useBlockEditingMode,
	LinkControl,
	__experimentalUseColorProps as useColorProps,
	__experimentalUseBorderProps as useBorderProps,
	__experimentalGetSpacingClassesAndStyles as useSpacingProps,
	getDimensionsClassesAndStyles as useDimensionsProps,
} from '@wordpress/block-editor';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { SVG, Rect, Path } from '@wordpress/primitives';
import { useSelect } from '@wordpress/data';
import { store as coreDataStore } from '@wordpress/core-data';
import { link, linkOff } from '@wordpress/icons';
import { displayShortcut, isKeyboardEvent } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';
import HtmlRenderer from '../utils/html-renderer';
import { CustomInserterModal } from './components';
import { NEW_TAB_TARGET, NOFOLLOW_REL } from './constants';
import { getUpdatedLinkAttributes } from './get-updated-link-attributes';

const LINK_SETTINGS = [
	...LinkControl.DEFAULT_LINK_SETTINGS,
	{
		id: 'nofollow',
		title: __( 'Mark as nofollow' ),
	},
];

const IconPlaceholder = ( { className, style } ) => (
	<SVG
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 60 60"
		preserveAspectRatio="none"
		fill="none"
		aria-hidden="true"
		className={ clsx( 'wp-block-icon__placeholder', className ) }
		style={ style }
	>
		<Rect width="60" height="60" fill="currentColor" fillOpacity={ 0.1 } />
		<Path
			vectorEffect="non-scaling-stroke"
			stroke="currentColor"
			strokeOpacity={ 0.25 }
			d="M60 60 0 0"
		/>
	</SVG>
);

export function Edit( { attributes, setAttributes, isSelected } ) {
	const { icon, ariaLabel, url, linkTarget, rel } = attributes;

	const [ isInserterOpen, setInserterOpen ] = useState( false );
	const [ isEditingURL, setIsEditingURL ] = useState( false );
	const [ popoverAnchor, setPopoverAnchor ] = useState( null );

	const isContentOnlyMode = useBlockEditingMode() === 'contentOnly';

	const colorProps = useColorProps( attributes );
	const spacingProps = useSpacingProps( attributes );
	const borderProps = useBorderProps( attributes );
	const dimensionsProps = useDimensionsProps( attributes );

	const isURLSet = !! url;
	const opensInNewTab = linkTarget === NEW_TAB_TARGET;
	const nofollow = !! rel?.includes( NOFOLLOW_REL );

	const linkValue = useMemo(
		() => ( { url, opensInNewTab, nofollow } ),
		[ url, opensInNewTab, nofollow ]
	);

	function onKeyDown( event ) {
		if ( isKeyboardEvent.primary( event, 'k' ) ) {
			startEditing( event );
		} else if ( isKeyboardEvent.primaryShift( event, 'k' ) ) {
			unlink();
		}
	}

	function startEditing( event ) {
		event.preventDefault();
		setIsEditingURL( true );
	}

	function unlink() {
		setAttributes( {
			url: undefined,
			linkTarget: undefined,
			rel: undefined,
		} );
		setIsEditingURL( false );
	}

	useEffect( () => {
		if ( ! isSelected ) {
			setIsEditingURL( false );
		}
	}, [ isSelected ] );

	const { selectedIcon, allIcons = [] } = useSelect(
		( select ) => {
			const { getEntityRecord, getEntityRecords } =
				select( coreDataStore );
			return {
				selectedIcon: icon
					? getEntityRecord( 'root', 'icon', icon )
					: null,
				allIcons: isInserterOpen
					? getEntityRecords( 'root', 'icon' )
					: undefined,
			};
		},
		[ isInserterOpen, icon ]
	);

	const iconToDisplay = selectedIcon?.content || '';

	const blockProps = useBlockProps( { ref: setPopoverAnchor, onKeyDown } );

	const blockControls = (
		<>
			<BlockControls group={ isContentOnlyMode ? 'inline' : 'other' }>
				<ToolbarButton
					onClick={ () => {
						setInserterOpen( true );
					} }
				>
					{ icon ? __( 'Replace' ) : __( 'Choose icon' ) }
				</ToolbarButton>
			</BlockControls>
			<BlockControls group="block">
				<ToolbarButton
					name="link"
					icon={ isURLSet ? linkOff : link }
					title={ isURLSet ? __( 'Unlink' ) : __( 'Link' ) }
					shortcut={
						isURLSet
							? displayShortcut.primaryShift( 'k' )
							: displayShortcut.primary( 'k' )
					}
					onClick={ isURLSet ? unlink : startEditing }
					isActive={ isURLSet }
				/>
			</BlockControls>
			{ isContentOnlyMode && icon && (
				// Add some extra controls for content attributes when content only mode is active.
				// With content only mode active, the inspector is hidden, so users need another way
				// to edit these attributes.
				<BlockControls group="other">
					<ToolbarGroup className="components-toolbar-group">
						<DropdownMenu
							icon=""
							popoverProps={ {
								className: 'is-alternate',
							} }
							text={ __( 'Label' ) }
						>
							{ () => (
								<TextControl
									className="wp-block-icon__toolbar-content"
									label={ __( 'Label' ) }
									value={ ariaLabel || '' }
									onChange={ ( value ) =>
										setAttributes( { ariaLabel: value } )
									}
									help={ __(
										'Briefly describe the icon to help screen reader users. Leave blank for decorative icons.'
									) }
									__next40pxDefaultSize
								/>
							) }
						</DropdownMenu>
					</ToolbarGroup>
				</BlockControls>
			) }
		</>
	);
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	const inspectorControls = icon && (
		<>
			<InspectorControls group="settings">
				<ToolsPanel
					label={ __( 'Settings' ) }
					resetAll={ () =>
						setAttributes( {
							ariaLabel: undefined,
						} )
					}
					dropdownMenuProps={ dropdownMenuProps }
				>
					<ToolsPanelItem
						label={ __( 'Label' ) }
						isShownByDefault
						hasValue={ () => !! ariaLabel }
						onDeselect={ () =>
							setAttributes( { ariaLabel: undefined } )
						}
					>
						<TextControl
							label={ __( 'Label' ) }
							help={ __(
								'Briefly describe the icon to help screen reader users. Leave blank for decorative icons.'
							) }
							value={ ariaLabel || '' }
							onChange={ ( value ) =>
								setAttributes( { ariaLabel: value } )
							}
							__next40pxDefaultSize
						/>
					</ToolsPanelItem>
				</ToolsPanel>
			</InspectorControls>
		</>
	);

	return (
		<>
			{ blockControls }
			{ inspectorControls }
			<div { ...blockProps }>
				{ icon ? (
					<HtmlRenderer
						html={ iconToDisplay }
						wrapperProps={ {
							className: clsx(
								colorProps.className,
								borderProps.className,
								spacingProps.className,
								dimensionsProps.className
							),
							style: {
								...colorProps.style,
								...borderProps.style,
								...spacingProps.style,
								...dimensionsProps.style,
							},
						} }
					/>
				) : (
					<IconPlaceholder
						className={ clsx(
							borderProps.className,
							spacingProps.className,
							dimensionsProps.className
						) }
						style={ {
							...borderProps.style,
							...spacingProps.style,
							...dimensionsProps.style,
							height: 'auto',
						} }
					/>
				) }
			</div>
			{ isSelected && ( isEditingURL || isURLSet ) && (
				<Popover
					placement="bottom"
					onClose={ () => setIsEditingURL( false ) }
					anchor={ popoverAnchor }
					focusOnMount={ isEditingURL ? 'firstElement' : false }
					__unstableSlotName="__unstable-block-tools-after"
					shift
				>
					<LinkControl
						value={ linkValue }
						onChange={ ( {
							url: newURL,
							opensInNewTab: newOpensInNewTab,
							nofollow: newNofollow,
						} ) =>
							setAttributes(
								getUpdatedLinkAttributes( {
									rel,
									url: newURL,
									opensInNewTab: newOpensInNewTab,
									nofollow: newNofollow,
								} )
							)
						}
						onRemove={ unlink }
						forceIsEditingLink={ isEditingURL }
						settings={ LINK_SETTINGS }
					/>
				</Popover>
			) }
			{ isInserterOpen && (
				<CustomInserterModal
					icons={ allIcons }
					setInserterOpen={ setInserterOpen }
					attributes={ attributes }
					setAttributes={ setAttributes }
				/>
			) }
		</>
	);
}

export default Edit;
