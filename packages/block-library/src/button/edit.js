/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import { NEW_TAB_TARGET, NOFOLLOW_REL } from './constants';
import { getUpdatedLinkAttributes } from './get-updated-link-attributes';
import removeAnchorTag from '../utils/remove-anchor-tag';
import { unlock } from '../lock-unlock';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState, useRef, useMemo } from '@wordpress/element';
import {
	Button,
	ButtonGroup,
	PanelBody,
	TextControl,
	ToolbarButton,
	Popover,
} from '@wordpress/components';
import {
	AlignmentControl,
	BlockControls,
	InspectorControls,
	RichText,
	useBlockProps,
	__experimentalUseBorderProps as useBorderProps,
	__experimentalUseColorProps as useColorProps,
	__experimentalGetSpacingClassesAndStyles as useSpacingProps,
	__experimentalGetShadowClassesAndStyles as useShadowProps,
	__experimentalLinkControl as LinkControl,
	__experimentalGetElementClassName,
	store as blockEditorStore,
	useBlockEditingMode,
} from '@wordpress/block-editor';
import { displayShortcut, isKeyboardEvent, ENTER } from '@wordpress/keycodes';
import { link, linkOff } from '@wordpress/icons';
import {
	createBlock,
	cloneBlock,
	getDefaultBlockName,
} from '@wordpress/blocks';
import { useMergeRefs, useRefEffect } from '@wordpress/compose';
import { useSelect, useDispatch } from '@wordpress/data';

const LINK_SETTINGS = [
	...LinkControl.DEFAULT_LINK_SETTINGS,
	{
		id: 'nofollow',
		title: __( 'Mark as nofollow' ),
	},
];

function useEnter( props ) {
	const { replaceBlocks, selectionChange } = useDispatch( blockEditorStore );
	const { getBlock, getBlockRootClientId, getBlockIndex } =
		useSelect( blockEditorStore );
	const propsRef = useRef( props );
	propsRef.current = props;
	return useRefEffect( ( element ) => {
		function onKeyDown( event ) {
			if ( event.defaultPrevented || event.keyCode !== ENTER ) {
				return;
			}
			const { content, clientId } = propsRef.current;
			if ( content.length ) {
				return;
			}
			event.preventDefault();
			const topParentListBlock = getBlock(
				getBlockRootClientId( clientId )
			);
			const blockIndex = getBlockIndex( clientId );
			const head = cloneBlock( {
				...topParentListBlock,
				innerBlocks: topParentListBlock.innerBlocks.slice(
					0,
					blockIndex
				),
			} );
			const middle = createBlock( getDefaultBlockName() );
			const after = topParentListBlock.innerBlocks.slice(
				blockIndex + 1
			);
			const tail = after.length
				? [
						cloneBlock( {
							...topParentListBlock,
							innerBlocks: after,
						} ),
				  ]
				: [];
			replaceBlocks(
				topParentListBlock.clientId,
				[ head, middle, ...tail ],
				1
			);
			// We manually change the selection here because we are replacing
			// a different block than the selected one.
			selectionChange( middle.clientId );
		}

		element.addEventListener( 'keydown', onKeyDown );
		return () => {
			element.removeEventListener( 'keydown', onKeyDown );
		};
	}, [] );
}

function WidthPanel( { selectedWidth, setAttributes } ) {
	function handleChange( newWidth ) {
		// Check if we are toggling the width off
		const width = selectedWidth === newWidth ? undefined : newWidth;

		// Update attributes.
		setAttributes( { width } );
	}

	return (
		<PanelBody title={ __( 'Width settings' ) }>
			<ButtonGroup aria-label={ __( 'Button width' ) }>
				{ [ 25, 50, 75, 100 ].map( ( widthValue ) => {
					return (
						<Button
							key={ widthValue }
							size="small"
							variant={
								widthValue === selectedWidth
									? 'primary'
									: undefined
							}
							onClick={ () => handleChange( widthValue ) }
						>
							{ widthValue }%
						</Button>
					);
				} ) }
			</ButtonGroup>
		</PanelBody>
	);
}

function ButtonEdit( props ) {
	const {
		attributes,
		setAttributes,
		className,
		isSelected,
		onReplace,
		mergeBlocks,
		clientId,
	} = props;
	const {
		tagName,
		textAlign,
		linkTarget,
		placeholder,
		rel,
		style,
		text,
		url,
		width,
		metadata,
	} = attributes;

	const TagName = tagName || 'a';

	function onKeyDown( event ) {
		if ( isKeyboardEvent.primary( event, 'k' ) ) {
			startEditing( event );
		} else if ( isKeyboardEvent.primaryShift( event, 'k' ) ) {
			unlink();
			richTextRef.current?.focus();
		}
	}

	// Use internal state instead of a ref to make sure that the component
	// re-renders when the popover's anchor updates.
	const [ popoverAnchor, setPopoverAnchor ] = useState( null );

	const borderProps = useBorderProps( attributes );
	const colorProps = useColorProps( attributes );
	const spacingProps = useSpacingProps( attributes );
	const shadowProps = useShadowProps( attributes );
	const ref = useRef();
	const richTextRef = useRef();
	const blockProps = useBlockProps( {
		ref: useMergeRefs( [ setPopoverAnchor, ref ] ),
		onKeyDown,
	} );
	const blockEditingMode = useBlockEditingMode();

	const [ isEditingURL, setIsEditingURL ] = useState( false );
	const isURLSet = !! url;
	const opensInNewTab = linkTarget === NEW_TAB_TARGET;
	const nofollow = !! rel?.includes( NOFOLLOW_REL );
	const isLinkTag = 'a' === TagName;

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

	// Memoize link value to avoid overriding the LinkControl's internal state.
	// This is a temporary fix. See https://github.com/WordPress/gutenberg/issues/51256.
	const linkValue = useMemo(
		() => ( { url, opensInNewTab, nofollow } ),
		[ url, opensInNewTab, nofollow ]
	);

	const useEnterRef = useEnter( { content: text, clientId } );
	const mergedRef = useMergeRefs( [ useEnterRef, richTextRef ] );

	const { lockUrlControls = false } = useSelect(
		( select ) => {
			if ( ! isSelected ) {
				return {};
			}

			const { getBlockBindingsSource } = unlock(
				select( blockEditorStore )
			);

			return {
				lockUrlControls:
					!! metadata?.bindings?.url &&
					getBlockBindingsSource( metadata?.bindings?.url?.source )
						?.lockAttributesEditing === true,
			};
		},
		[ isSelected ]
	);

	return (
		<>
			<div
				{ ...blockProps }
				className={ classnames( blockProps.className, {
					[ `has-custom-width wp-block-button__width-${ width }` ]:
						width,
					[ `has-custom-font-size` ]: blockProps.style.fontSize,
				} ) }
			>
				<RichText
					ref={ mergedRef }
					aria-label={ __( 'Button text' ) }
					placeholder={ placeholder || __( 'Add text…' ) }
					value={ text }
					onChange={ ( value ) =>
						setAttributes( {
							text: removeAnchorTag( value ),
						} )
					}
					withoutInteractiveFormatting
					className={ classnames(
						className,
						'wp-block-button__link',
						colorProps.className,
						borderProps.className,
						{
							[ `has-text-align-${ textAlign }` ]: textAlign,
							// For backwards compatibility add style that isn't
							// provided via block support.
							'no-border-radius': style?.border?.radius === 0,
						},
						__experimentalGetElementClassName( 'button' )
					) }
					style={ {
						...borderProps.style,
						...colorProps.style,
						...spacingProps.style,
						...shadowProps.style,
					} }
					onSplit={ ( value ) =>
						createBlock( 'core/button', {
							...attributes,
							text: value,
						} )
					}
					onReplace={ onReplace }
					onMerge={ mergeBlocks }
					identifier="text"
				/>
			</div>
			<BlockControls group="block">
				{ blockEditingMode === 'default' && (
					<AlignmentControl
						value={ textAlign }
						onChange={ ( nextAlign ) => {
							setAttributes( { textAlign: nextAlign } );
						} }
					/>
				) }
				{ ! isURLSet && isLinkTag && ! lockUrlControls && (
					<ToolbarButton
						name="link"
						icon={ link }
						title={ __( 'Link' ) }
						shortcut={ displayShortcut.primary( 'k' ) }
						onClick={ startEditing }
					/>
				) }
				{ isURLSet && isLinkTag && ! lockUrlControls && (
					<ToolbarButton
						name="link"
						icon={ linkOff }
						title={ __( 'Unlink' ) }
						shortcut={ displayShortcut.primaryShift( 'k' ) }
						onClick={ unlink }
						isActive={ true }
					/>
				) }
			</BlockControls>
			{ isLinkTag &&
				isSelected &&
				( isEditingURL || isURLSet ) &&
				! lockUrlControls && (
					<Popover
						placement="bottom"
						onClose={ () => {
							setIsEditingURL( false );
							richTextRef.current?.focus();
						} }
						anchor={ popoverAnchor }
						focusOnMount={ isEditingURL ? 'firstElement' : false }
						__unstableSlotName={ '__unstable-block-tools-after' }
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
							onRemove={ () => {
								unlink();
								richTextRef.current?.focus();
							} }
							forceIsEditingLink={ isEditingURL }
							settings={ LINK_SETTINGS }
						/>
					</Popover>
				) }
			<InspectorControls>
				<WidthPanel
					selectedWidth={ width }
					setAttributes={ setAttributes }
				/>
			</InspectorControls>
			<InspectorControls group="advanced">
				{ isLinkTag && (
					<TextControl
						__nextHasNoMarginBottom
						label={ __( 'Link rel' ) }
						value={ rel || '' }
						onChange={ ( newRel ) =>
							setAttributes( { rel: newRel } )
						}
					/>
				) }
			</InspectorControls>
		</>
	);
}

export default ButtonEdit;
