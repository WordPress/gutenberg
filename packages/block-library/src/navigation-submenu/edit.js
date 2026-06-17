/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import {
	ToolbarButton,
	ToolbarGroup,
	ToggleControl,
	Notice,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { displayShortcut, isKeyboardEvent } from '@wordpress/keycodes';
import { __ } from '@wordpress/i18n';
import {
	BlockControls,
	InnerBlocks,
	InspectorControls,
	useInnerBlocksProps,
	RichText,
	useBlockProps,
	useBlockEditingMode,
	store as blockEditorStore,
	getColorClassName,
} from '@wordpress/block-editor';
import { isURL, prependHTTP } from '@wordpress/url';
import { useState, useEffect, useRef, useCallback } from '@wordpress/element';
import { link as linkIcon, removeSubmenu } from '@wordpress/icons';
import { speak } from '@wordpress/a11y';
import { createBlock } from '@wordpress/blocks';
import { useMergeRefs, usePrevious } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { ItemSubmenuIcon } from './icons';
import {
	Controls,
	LinkUI,
	useEntityBinding,
	useHandleLinkChange,
	useIsInvalidLink,
	InvalidDraftDisplay,
	useEnableLinkStatusValidation,
	useIsDraggingWithin,
	selectLabelText,
} from '../navigation-link/shared';
import {
	getColors,
	getNavigationChildBlockProps,
} from '../navigation/edit/utils';
import { DEFAULT_BLOCK } from '../navigation/constants';
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

const ALLOWED_BLOCKS = [
	'core/navigation-link',
	'core/navigation-submenu',
	'core/page-list',
	'core/loginout',
];

/**
 * @typedef {'post-type'|'custom'|'taxonomy'|'post-type-archive'} WPNavigationLinkKind
 */

/**
 * Navigation Link Block Attributes
 *
 * @typedef {Object} WPNavigationLinkBlockAttributes
 *
 * @property {string}               [label]         Link text.
 * @property {WPNavigationLinkKind} [kind]          Kind is used to differentiate between term and post ids to check post draft status.
 * @property {string}               [type]          The type such as post, page, tag, category and other custom types.
 * @property {string}               [rel]           The relationship of the linked URL.
 * @property {number}               [id]            A post or term id.
 * @property {boolean}              [opensInNewTab] Sets link target to _blank when true.
 * @property {string}               [url]           Link href.
 */

export default function NavigationSubmenuEdit( {
	attributes,
	isSelected,
	setAttributes,
	mergeBlocks,
	onReplace,
	context,
	clientId,
} ) {
	const { label, url, description, kind, type, id } = attributes;

	const { showSubmenuIcon, maxNestingLevel, submenuVisibility, layout } =
		context;
	const blockEditingMode = useBlockEditingMode();

	// Get orientation from layout context
	const orientation = layout?.orientation || 'horizontal';

	// Force click-only behavior in contentOnly mode to prevent hover dropdowns
	const openSubmenusOnClick =
		blockEditingMode !== 'default' ? true : submenuVisibility === 'click';

	// URL binding logic
	const { hasUrlBinding, isBoundEntityAvailable, entityRecord } =
		useEntityBinding( {
			clientId,
			attributes,
		} );

	const handleLinkChange = useHandleLinkChange( {
		clientId,
		attributes,
		setAttributes,
		allowTextUpdate: true,
	} );

	const { __unstableMarkNextChangeAsNotPersistent, replaceBlock } =
		useDispatch( blockEditorStore );

	// Get the parent navigation block's clientId
	const parentNavigationBlockClientId = useSelect(
		( select ) => {
			const { getBlockParentsByBlockName } = select( blockEditorStore );
			const parentBlocks = getBlockParentsByBlockName(
				clientId,
				'core/navigation'
			);
			// Return the immediate parent navigation block
			return parentBlocks?.[ 0 ];
		},
		[ clientId ]
	);

	// Function to update parent navigation block attributes
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const updateParentNavigationAttributes = useCallback(
		( newAttributes ) => {
			if ( parentNavigationBlockClientId ) {
				updateBlockAttributes(
					parentNavigationBlockClientId,
					newAttributes
				);
			}
		},
		[ parentNavigationBlockClientId, updateBlockAttributes ]
	);

	const [ isLinkOpen, setIsLinkOpen ] = useState( false );
	// Use internal state instead of a ref to make sure that the component
	// re-renders when the popover's anchor updates.
	const [ popoverAnchor, setPopoverAnchor ] = useState( null );
	const listItemRef = useRef( null );
	const isDraggingWithin = useIsDraggingWithin( listItemRef );
	const itemLabelPlaceholder = __( 'Add text…' );
	const ref = useRef();

	const {
		parentCount,
		isParentOfSelectedBlock,
		isImmediateParentOfSelectedBlock,
		hasChildren,
		selectedBlockHasChildren,
		onlyDescendantIsEmptyLink,
	} = useSelect(
		( select ) => {
			const {
				hasSelectedInnerBlock,
				getSelectedBlockClientId,
				getBlockParentsByBlockName,
				getBlock,
				getBlockCount,
				getBlockOrder,
			} = select( blockEditorStore );

			let _onlyDescendantIsEmptyLink;

			const selectedBlockId = getSelectedBlockClientId();

			const selectedBlockChildren = getBlockOrder( selectedBlockId );

			// Check for a single descendant in the submenu. If that block
			// is a link block in a "placeholder" state with no label then
			// we can consider as an "empty" link.
			if ( selectedBlockChildren?.length === 1 ) {
				const singleBlock = getBlock( selectedBlockChildren[ 0 ] );

				_onlyDescendantIsEmptyLink =
					singleBlock?.name === 'core/navigation-link' &&
					! singleBlock?.attributes?.label;
			}

			return {
				parentCount: getBlockParentsByBlockName(
					clientId,
					'core/navigation-submenu'
				).length,
				isParentOfSelectedBlock: hasSelectedInnerBlock(
					clientId,
					true
				),
				isImmediateParentOfSelectedBlock: hasSelectedInnerBlock(
					clientId,
					false
				),
				hasChildren: !! getBlockCount( clientId ),
				selectedBlockHasChildren: !! selectedBlockChildren?.length,
				onlyDescendantIsEmptyLink: _onlyDescendantIsEmptyLink,
			};
		},
		[ clientId ]
	);

	const validateLinkStatus = useEnableLinkStatusValidation( clientId );

	const prevHasChildren = usePrevious( hasChildren );

	// Check if the submenu's parent link is invalid or draft
	const [ isInvalid, isDraft ] = useIsInvalidLink(
		kind,
		type,
		id,
		validateLinkStatus
	);

	// Show the LinkControl on mount if the URL is empty
	// ( When adding a new menu item)
	// This can't be done in the useState call because it conflicts
	// with the autofocus behavior of the BlockListBlock component.
	useEffect( () => {
		if ( ! openSubmenusOnClick && ! url ) {
			setIsLinkOpen( true );
		}
	}, [] );

	/**
	 * The hook shouldn't be necessary but due to a focus loss happening
	 * when selecting a suggestion in the link popover, we force close on block unselection.
	 */
	useEffect( () => {
		if ( ! isSelected ) {
			setIsLinkOpen( false );
		}
	}, [ isSelected ] );

	// If the LinkControl popover is open and the URL has changed, close the LinkControl and focus the label text.
	useEffect( () => {
		if ( isLinkOpen && url ) {
			// Does this look like a URL and have something TLD-ish?
			if (
				isURL( prependHTTP( label ) ) &&
				/^.+\.[a-z]+/.test( label )
			) {
				// Focus and select the label text.
				selectLabelText( ref );
			}
		}
	}, [ url ] );

	const {
		textColor,
		customTextColor,
		backgroundColor,
		customBackgroundColor,
	} = getColors( context, parentCount > 0 );

	function onKeyDown( event ) {
		if ( isKeyboardEvent.primary( event, 'k' ) ) {
			// Required to prevent the command center from opening,
			// as it shares the CMD+K shortcut.
			// See https://github.com/WordPress/gutenberg/pull/59845.
			event.preventDefault();
			// If we don't stop propagation, this event bubbles up to the parent submenu item
			event.stopPropagation();
			setIsLinkOpen( true );
		}
	}

	const blockProps = useBlockProps( {
		ref: useMergeRefs( [ setPopoverAnchor, listItemRef ] ),
		className: clsx( 'wp-block-navigation-item', {
			'is-editing': isSelected || isParentOfSelectedBlock,
			'is-dragging-within': isDraggingWithin,
			'has-link': !! url,
			'has-child': hasChildren,
			'has-text-color': !! textColor || !! customTextColor,
			[ getColorClassName( 'color', textColor ) ]: !! textColor,
			'has-background': !! backgroundColor || customBackgroundColor,
			[ getColorClassName( 'background-color', backgroundColor ) ]:
				!! backgroundColor,
			'open-on-click': openSubmenusOnClick,
			'open-always': submenuVisibility === 'always',
		} ),
		style: {
			color: ! textColor && customTextColor,
			backgroundColor: ! backgroundColor && customBackgroundColor,
		},
		onKeyDown,
	} );

	// Always use overlay colors for submenus.
	const innerBlocksColors = getColors( context, true );

	const allowedBlocks =
		parentCount >= maxNestingLevel
			? ALLOWED_BLOCKS.filter(
					( blockName ) => blockName !== 'core/navigation-submenu'
			  )
			: ALLOWED_BLOCKS;

	const navigationChildBlockProps =
		getNavigationChildBlockProps( innerBlocksColors );
	const innerBlocksProps = useInnerBlocksProps( navigationChildBlockProps, {
		allowedBlocks,
		defaultBlock: DEFAULT_BLOCK,
		directInsert: true,

		// Ensure block toolbar is not too far removed from item
		// being edited.
		// see: https://github.com/WordPress/gutenberg/pull/34615.
		__experimentalCaptureToolbars: true,

		renderAppender:
			isSelected ||
			( isImmediateParentOfSelectedBlock &&
				! selectedBlockHasChildren ) ||
			// Show the appender while dragging to allow inserting element between item and the appender.
			hasChildren
				? InnerBlocks.ButtonBlockAppender
				: false,
	} );

	const ParentElement = openSubmenusOnClick ? 'button' : 'a';

	function transformToLink() {
		const newLinkBlock = createBlock( 'core/navigation-link', attributes );
		replaceBlock( clientId, newLinkBlock );
	}

	useEffect( () => {
		// If block becomes empty, transform to Navigation Link.
		if ( ! hasChildren && prevHasChildren ) {
			// This side-effect should not create an undo level as those should
			// only be created via user interactions.
			__unstableMarkNextChangeAsNotPersistent();
			transformToLink();
		}
	}, [ hasChildren, prevHasChildren ] );

	const canConvertToLink =
		! selectedBlockHasChildren || onlyDescendantIsEmptyLink;

	const submenuAccessibilityNotice =
		! showSubmenuIcon &&
		submenuVisibility !== 'click' &&
		submenuVisibility !== 'always'
			? __(
					'The current menu options offer reduced accessibility for users and are not recommended. Enabling either "Open on Click" or "Show arrow" offers enhanced accessibility by allowing keyboard users to browse submenus selectively.'
			  )
			: '';

	const isFirstRender = useRef( true ); // Don't speak on first render.
	useEffect( () => {
		if ( ! isFirstRender.current && submenuAccessibilityNotice ) {
			speak( submenuAccessibilityNotice );
		}
		isFirstRender.current = false;
	}, [ submenuAccessibilityNotice ] );

	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					{ ! openSubmenusOnClick && (
						<ToolbarButton
							name="link"
							icon={ linkIcon }
							title={ __( 'Link' ) }
							shortcut={ displayShortcut.primary( 'k' ) }
							onClick={ () => {
								setIsLinkOpen( true );
							} }
						/>
					) }

					<ToolbarButton
						name="revert"
						icon={ removeSubmenu }
						title={ __( 'Convert to Link' ) }
						onClick={ transformToLink }
						className="wp-block-navigation__submenu__revert"
						disabled={ ! canConvertToLink }
					/>
				</ToolbarGroup>
			</BlockControls>
			<InspectorControls group="content">
				<Controls
					attributes={ attributes }
					setAttributes={ setAttributes }
					clientId={ clientId }
					isLinkEditable={ ! openSubmenusOnClick }
				/>
			</InspectorControls>
			<InspectorControls>
				{ hasChildren && (
					<ToolsPanel
						label={ __( 'Settings' ) }
						resetAll={ () => {
							updateParentNavigationAttributes( {
								showSubmenuIcon: true,
								submenuVisibility: 'hover',
								overlayMenu: 'mobile',
								hasIcon: true,
								icon: 'handle',
							} );
						} }
						dropdownMenuProps={ dropdownMenuProps }
					>
						<div style={ { gridColumn: '1 / -1' } }>
							<Notice
								spokenMessage={ null }
								status="info"
								isDismissible={ false }
								className="wp-block-navigation-submenu__global-settings-notice"
								style={ { margin: 0 } }
							>
								{ __(
									'These settings apply to all submenus within this navigation block.'
								) }
							</Notice>
						</div>
						<ToolsPanelItem
							hasValue={ () => submenuVisibility !== 'hover' }
							label={ __( 'Submenu Visibility' ) }
							onDeselect={ () =>
								updateParentNavigationAttributes( {
									submenuVisibility: 'hover',
								} )
							}
							isShownByDefault
						>
							<ToggleGroupControl
								__next40pxDefaultSize
								label={ __( 'Submenu Visibility' ) }
								value={ submenuVisibility }
								onChange={ ( value ) => {
									const newAttributes = {
										submenuVisibility: value,
									};
									const prevSubmenuVisibility =
										submenuVisibility;
									// If "always" is selected, hide the arrow
									if ( value === 'always' ) {
										newAttributes.showSubmenuIcon = false;
									} else if (
										value === 'click' ||
										prevSubmenuVisibility === 'always'
									) {
										// When switching to "click" or away from "always", show the arrow
										newAttributes.showSubmenuIcon = true;
									}

									updateParentNavigationAttributes(
										newAttributes
									);
								} }
								isBlock
							>
								<ToggleGroupControlOption
									value="hover"
									label={ __( 'Hover' ) }
								/>
								<ToggleGroupControlOption
									value="click"
									label={ __( 'Click' ) }
								/>
								{ orientation === 'vertical' && (
									<ToggleGroupControlOption
										value="always"
										label={ __( 'Always' ) }
									/>
								) }
							</ToggleGroupControl>
						</ToolsPanelItem>

						<ToolsPanelItem
							hasValue={ () => ! showSubmenuIcon }
							label={ __( 'Show arrow' ) }
							onDeselect={ () =>
								updateParentNavigationAttributes( {
									showSubmenuIcon: true,
								} )
							}
							isDisabled={
								submenuVisibility === 'click' ||
								submenuVisibility === 'always'
							}
							isShownByDefault
						>
							<ToggleControl
								checked={ showSubmenuIcon }
								onChange={ ( value ) => {
									updateParentNavigationAttributes( {
										showSubmenuIcon: value,
									} );
								} }
								disabled={
									submenuVisibility === 'click' ||
									submenuVisibility === 'always'
								}
								label={ __( 'Show arrow' ) }
							/>
						</ToolsPanelItem>

						{ submenuAccessibilityNotice && (
							<Notice
								spokenMessage={ null }
								status="warning"
								isDismissible={ false }
								className="wp-block-navigation__submenu-accessibility-notice"
							>
								{ submenuAccessibilityNotice }
							</Notice>
						) }
					</ToolsPanel>
				) }
			</InspectorControls>
			<div { ...blockProps }>
				<ParentElement className="wp-block-navigation-item__content">
					{ ! isInvalid && ! isDraft && (
						<>
							<RichText
								ref={ ref }
								identifier="label"
								className="wp-block-navigation-item__label"
								value={ label }
								onChange={ ( labelValue ) =>
									setAttributes( { label: labelValue } )
								}
								onMerge={ mergeBlocks }
								onReplace={ onReplace }
								aria-label={ __( 'Navigation link text' ) }
								placeholder={ itemLabelPlaceholder }
								withoutInteractiveFormatting
								onClick={ () => {
									if ( ! openSubmenusOnClick && ! url ) {
										setIsLinkOpen( true );
									}
								} }
							/>
							{ description && (
								<span className="wp-block-navigation-item__description">
									{ description }
								</span>
							) }
						</>
					) }
					{ ( isInvalid || isDraft ) && (
						<InvalidDraftDisplay
							label={ label }
							isInvalid={ isInvalid }
							isDraft={ isDraft }
							className="wp-block-navigation-item__label"
						/>
					) }
					{ ! openSubmenusOnClick && isLinkOpen && (
						<LinkUI
							clientId={ clientId }
							link={ attributes }
							entity={ {
								entityRecord,
								hasBinding: hasUrlBinding,
								isEntityAvailable: isBoundEntityAvailable,
							} }
							onClose={ () => {
								setIsLinkOpen( false );
							} }
							anchor={ popoverAnchor }
							onRemove={ () => {
								setAttributes( { url: '' } );
								speak( __( 'Link removed.' ), 'assertive' );
							} }
							onChange={ handleLinkChange }
						/>
					) }
				</ParentElement>
				{ ( showSubmenuIcon || openSubmenusOnClick ) && (
					<span className="wp-block-navigation__submenu-icon">
						<ItemSubmenuIcon />
					</span>
				) }
				<div { ...innerBlocksProps } />
			</div>
		</>
	);
}
