/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	ToolbarButton,
	ToolbarGroup,
	VisuallyHidden,
} from '@wordpress/components';
import { displayShortcut, isKeyboardEvent } from '@wordpress/keycodes';
import { __, sprintf } from '@wordpress/i18n';
import {
	BlockControls,
	InspectorControls,
	RichText,
	useBlockProps,
	store as blockEditorStore,
	getColorClassName,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { isURL, prependHTTP } from '@wordpress/url';
import { useState, useEffect, useRef, useCallback } from '@wordpress/element';
import { link as linkIcon, addSubmenu } from '@wordpress/icons';
import { useMergeRefs, useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { getColors } from '../navigation/edit/utils';
import {
	Controls,
	LinkUI,
	useEntityBinding,
	MissingEntityHelpText,
	useHandleLinkChange,
	useIsInvalidLink,
	InvalidDraftDisplay,
	useEnableLinkStatusValidation,
	useIsDraggingWithin,
	selectLabelText,
} from './shared';

const DEFAULT_BLOCK = { name: 'core/navigation-link' };
const NESTING_BLOCK_NAMES = [
	'core/navigation-link',
	'core/navigation-submenu',
];

function getMissingText( type ) {
	let missingText = '';

	switch ( type ) {
		case 'post':
			/* translators: label for missing post in navigation link block */
			missingText = __( 'Select post' );
			break;
		case 'page':
			/* translators: label for missing page in navigation link block */
			missingText = __( 'Select page' );
			break;
		case 'category':
			/* translators: label for missing category in navigation link block */
			missingText = __( 'Select category' );
			break;
		case 'tag':
			/* translators: label for missing tag in navigation link block */
			missingText = __( 'Select tag' );
			break;
		default:
			/* translators: label for missing values in navigation link block */
			missingText = __( 'Add link' );
	}

	return missingText;
}

export default function NavigationLinkEdit( {
	attributes,
	isSelected,
	setAttributes,
	insertBlocksAfter,
	mergeBlocks,
	onReplace,
	context,
	clientId,
} ) {
	const { id, label, type, url, description, kind, metadata } = attributes;
	const { maxNestingLevel } = context;

	const {
		replaceBlock,
		__unstableMarkNextChangeAsNotPersistent,
		selectBlock,
	} = useDispatch( blockEditorStore );
	// Have the link editing ui open on mount when lacking a url and selected.
	const [ isLinkOpen, setIsLinkOpen ] = useState( isSelected && ! url );
	// Use internal state instead of a ref to make sure that the component
	// re-renders when the popover's anchor updates.
	const [ popoverAnchor, setPopoverAnchor ] = useState( null );
	const listItemRef = useRef( null );
	const isDraggingWithin = useIsDraggingWithin( listItemRef );
	const itemLabelPlaceholder = __( 'Add label…' );
	const ref = useRef();
	const linkUIref = useRef();
	// A link is "new" only if it has an undefined label
	// After the link is created, even if no label is provided, it's set to an empty string.
	const isNewLink = useRef( label === undefined );
	// Track whether we should focus the submenu appender when closing the link UI
	const shouldSelectSubmenuAppenderOnClose = useRef( false );

	const {
		isAtMaxNesting,
		isTopLevelLink,
		isParentOfSelectedBlock,
		hasChildren,
		parentBlockClientId,
		isSubmenu,
	} = useSelect(
		( select ) => {
			const {
				getBlockCount,
				getBlockName,
				getBlockRootClientId,
				hasSelectedInnerBlock,
				getBlockParentsByBlockName,
			} = select( blockEditorStore );
			const rootClientId = getBlockRootClientId( clientId );
			const parentBlockName = getBlockName( rootClientId );
			const isTopLevel = parentBlockName === 'core/navigation';
			const rootNavigationClientId = isTopLevel
				? rootClientId
				: getBlockParentsByBlockName(
						clientId,
						'core/navigation'
				  )[ 0 ];

			// Get the immediate parent - if it's a submenu, use it; otherwise use the navigation block
			const parentBlockId =
				parentBlockName === 'core/navigation-submenu'
					? rootClientId
					: rootNavigationClientId;

			return {
				isAtMaxNesting:
					getBlockParentsByBlockName( clientId, NESTING_BLOCK_NAMES )
						.length >= maxNestingLevel,
				isTopLevelLink: isTopLevel,
				isParentOfSelectedBlock: hasSelectedInnerBlock(
					clientId,
					true
				),
				hasChildren: !! getBlockCount( clientId ),
				parentBlockClientId: parentBlockId,
				isSubmenu: parentBlockName === 'core/navigation-submenu',
			};
		},
		[ clientId, maxNestingLevel ]
	);

	const validateLinkStatus = useEnableLinkStatusValidation( clientId );
	const { getBlocks } = useSelect( blockEditorStore );

	// URL binding logic
	const { hasUrlBinding, isBoundEntityAvailable } = useEntityBinding( {
		clientId,
		attributes,
	} );

	const handleLinkChange = useHandleLinkChange( {
		clientId,
		attributes,
		setAttributes,
	} );

	const [ isInvalid, isDraft ] = useIsInvalidLink(
		kind,
		type,
		id,
		validateLinkStatus
	);

	/**
	 * Transform to submenu block.
	 */
	const transformToSubmenu = useCallback( () => {
		let innerBlocks = getBlocks( clientId );
		if ( innerBlocks.length === 0 ) {
			innerBlocks = [ createBlock( 'core/navigation-link' ) ];
			selectBlock( innerBlocks[ 0 ].clientId );
		}
		const newSubmenu = createBlock(
			'core/navigation-submenu',
			attributes,
			innerBlocks
		);
		replaceBlock( clientId, newSubmenu );
	}, [ getBlocks, clientId, selectBlock, replaceBlock, attributes ] );

	// On mount, if this is a new link without a URL and it's selected,
	// select the parent block (submenu or navigation) instead to keep the appender visible.
	// This helps us return focus to the appender if the user closes the link ui without creating a link.
	// If we leave focus on this block, then when we close the link without creating a link, focus will
	// be lost during the new block selection process.
	useEffect( () => {
		if ( isNewLink.current && isSelected ) {
			selectBlock( parentBlockClientId );
		}
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect( () => {
		// If block has inner blocks, transform to Submenu.
		if ( hasChildren ) {
			// This side-effect should not create an undo level as those should
			// only be created via user interactions.
			__unstableMarkNextChangeAsNotPersistent();
			transformToSubmenu();
		}
	}, [
		hasChildren,
		__unstableMarkNextChangeAsNotPersistent,
		transformToSubmenu,
	] );

	// Handle link UI when a new link is created
	useEffect( () => {
		// We know if a link was just created from our link UI if
		// 1. isNewLink.current is true
		// 2. url has a value
		// 3. isLinkOpen is true
		if ( ! isNewLink.current || ! url || ! isLinkOpen ) {
			return;
		}

		// Ensure this only runs once
		isNewLink.current = false;

		// We just created a link and the block is now selected.
		// If the label looks like a URL, focus and select the label text.
		if ( isURL( prependHTTP( label ) ) && /^.+\.[a-z]+/.test( label ) ) {
			// Focus and select the label text.
			selectLabelText( ref );
		} else {
			// If the link was just created, we want to select the block so the inspector controls
			// are accurate.
			selectBlock( clientId, null );

			// Edge case: When the created link is the first child of a submenu, the focus will have
			// originated from the add submenu toolbar button. In this case, we need to return focus
			// to the submenu appender if the user closes the link ui using the keyboard.
			// Check if this is the first and only child of a newly created submenu.
			if ( isSubmenu ) {
				const parentBlocks = getBlocks( parentBlockClientId );
				// If this is the only child, then this is a new submenu.
				// Set the flag to select the submenu appender when the link ui is closed.
				if (
					parentBlocks.length === 1 &&
					parentBlocks[ 0 ].clientId === clientId
				) {
					shouldSelectSubmenuAppenderOnClose.current = true;
				}
			}
		}
	}, [ url, isLinkOpen, isNewLink, label ] );

	/**
	 * Removes the current link if set.
	 */
	function removeLink() {
		// Reset all attributes that comprise the link.
		// It is critical that all attributes are reset
		// to their default values otherwise this may
		// in advertently trigger side effects because
		// the values will have "changed".
		setAttributes( {
			url: undefined,
			label: undefined,
			id: undefined,
			kind: undefined,
			type: undefined,
			opensInNewTab: false,
		} );

		// Close the link editing UI.
		setIsLinkOpen( false );
	}

	const {
		textColor,
		customTextColor,
		backgroundColor,
		customBackgroundColor,
	} = getColors( context, ! isTopLevelLink );

	function onKeyDown( event ) {
		if ( isKeyboardEvent.primary( event, 'k' ) ) {
			// Required to prevent the command center from opening,
			// as it shares the CMD+K shortcut.
			// See https://github.com/WordPress/gutenberg/pull/59845.
			event.preventDefault();
			// If this link is a child of a parent submenu item, the parent submenu item event will also open, closing this popover
			event.stopPropagation();
			setIsLinkOpen( true );
		}
	}

	const instanceId = useInstanceId( NavigationLinkEdit );
	const hasMissingEntity = hasUrlBinding && ! isBoundEntityAvailable;
	const missingEntityDescriptionId = hasMissingEntity
		? sprintf( 'navigation-link-edit-%d-desc', instanceId )
		: undefined;

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
		} ),
		'aria-describedby': missingEntityDescriptionId,
		'aria-invalid': hasMissingEntity,
		style: {
			color: ! textColor && customTextColor,
			backgroundColor: ! backgroundColor && customBackgroundColor,
		},
		onKeyDown,
	} );

	const innerBlocksProps = useInnerBlocksProps(
		{
			...blockProps,
			className: 'remove-outline', // Remove the outline from the inner blocks container.
		},
		{
			defaultBlock: DEFAULT_BLOCK,
			directInsert: true,
			renderAppender: false,
		}
	);

	const needsValidLink =
		( ! url && ! ( hasUrlBinding && isBoundEntityAvailable ) ) ||
		isInvalid ||
		isDraft ||
		( hasUrlBinding && ! isBoundEntityAvailable );

	if ( needsValidLink ) {
		blockProps.onClick = () => {
			setIsLinkOpen( true );
		};
	}

	const classes = clsx( 'wp-block-navigation-item__content', {
		'wp-block-navigation-link__placeholder': needsValidLink,
	} );

	const missingText = getMissingText( type );

	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton
						name="link"
						icon={ linkIcon }
						title={ __( 'Link' ) }
						shortcut={ displayShortcut.primary( 'k' ) }
						onClick={ () => {
							setIsLinkOpen( true );
						} }
					/>
					{ ! isAtMaxNesting && (
						<ToolbarButton
							name="submenu"
							icon={ addSubmenu }
							title={ __( 'Add submenu' ) }
							onClick={ transformToSubmenu }
						/>
					) }
				</ToolbarGroup>
			</BlockControls>
			<InspectorControls>
				<Controls
					attributes={ attributes }
					setAttributes={ setAttributes }
					clientId={ clientId }
				/>
			</InspectorControls>
			<div { ...blockProps }>
				{ hasMissingEntity && (
					<VisuallyHidden id={ missingEntityDescriptionId }>
						<MissingEntityHelpText type={ type } kind={ kind } />
					</VisuallyHidden>
				) }
				{ /* eslint-disable jsx-a11y/anchor-is-valid */ }
				<a className={ classes }>
					{ /* eslint-enable */ }
					{ ! url && ! metadata?.bindings?.url ? (
						<div className="wp-block-navigation-link__placeholder-text">
							<span>{ missingText }</span>
						</div>
					) : (
						<>
							{ ! isInvalid && ! isDraft && (
								<>
									<RichText
										ref={ ref }
										identifier="label"
										className="wp-block-navigation-item__label"
										value={ label }
										onChange={ ( labelValue ) =>
											setAttributes( {
												label: labelValue,
											} )
										}
										onMerge={ mergeBlocks }
										onReplace={ onReplace }
										__unstableOnSplitAtEnd={ () =>
											insertBlocksAfter(
												createBlock(
													'core/navigation-link'
												)
											)
										}
										aria-label={ __(
											'Navigation link text'
										) }
										placeholder={ itemLabelPlaceholder }
										withoutInteractiveFormatting
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
									className="wp-block-navigation-link__label"
								/>
							) }
						</>
					) }
					{ isLinkOpen && (
						<LinkUI
							ref={ linkUIref }
							clientId={ clientId }
							link={ attributes }
							onClose={ () => {
								setIsLinkOpen( false );
								// If there is no link and no binding, remove the auto-inserted block.
								// This avoids empty blocks which can provided a poor UX.
								// Don't remove if binding exists (even if entity is unavailable) so user can fix it.
								if ( ! url && ! hasUrlBinding ) {
									onReplace( [] );
									return;
								}

								// Edge case: If this is the first child of a new submenu, focus the submenu's appender
								if (
									shouldSelectSubmenuAppenderOnClose.current
								) {
									shouldSelectSubmenuAppenderOnClose.current = false;

									// The appender is the next sibling in the DOM after the current block
									if (
										listItemRef.current?.nextElementSibling
									) {
										const appenderButton =
											listItemRef.current.nextElementSibling.querySelector(
												'.block-editor-button-block-appender'
											);
										if ( appenderButton ) {
											appenderButton.focus();
										}
									}
								}
							} }
							anchor={ popoverAnchor }
							onRemove={ removeLink }
							onChange={ handleLinkChange }
						/>
					) }
				</a>
				<div { ...innerBlocksProps } />
			</div>
		</>
	);
}
