/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * Internal dependencies
 */
import { NEW_TAB_TARGET, NOFOLLOW_REL } from './constants';
import { getUpdatedLinkAttributes } from './get-updated-link-attributes';
import removeAnchorTag from '../utils/remove-anchor-tag';
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';
import { unlock } from '../lock-unlock';
import useDeprecatedTextAlign from '../utils/deprecated-text-align-attributes';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	useEffect,
	useState,
	useRef,
	useMemo,
	createInterpolateElement,
} from '@wordpress/element';
import {
	TextControl,
	ToolbarButton,
	Popover,
	ExternalLink,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import {
	BlockControls,
	InspectorControls,
	RichText,
	useBlockProps,
	LinkControl,
	__experimentalUseBorderProps as useBorderProps,
	__experimentalUseColorProps as useColorProps,
	__experimentalGetSpacingClassesAndStyles as useSpacingProps,
	__experimentalGetShadowClassesAndStyles as useShadowProps,
	__experimentalGetElementClassName,
	store as blockEditorStore,
	useBlockEditingMode,
	getTypographyClassesAndStyles as useTypographyProps,
	useSettings,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { displayShortcut, isKeyboardEvent, ENTER } from '@wordpress/keycodes';
import { link, linkOff } from '@wordpress/icons';
import {
	createBlock,
	cloneBlock,
	getDefaultBlockName,
	getBlockBindingsSource,
} from '@wordpress/blocks';
import { useMergeRefs, useRefEffect } from '@wordpress/compose';
import { useSelect, useDispatch } from '@wordpress/data';

const { HTMLElementControl } = unlock( blockEditorPrivateApis );

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
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	return (
		<ToolsPanel
			label={ __( 'Settings' ) }
			resetAll={ () => setAttributes( { width: undefined } ) }
			dropdownMenuProps={ dropdownMenuProps }
		>
			<ToolsPanelItem
				label={ __( 'Width' ) }
				isShownByDefault
				hasValue={ () => !! selectedWidth }
				onDeselect={ () => setAttributes( { width: undefined } ) }
				__nextHasNoMarginBottom
			>
				<ToggleGroupControl
					label={ __( 'Width' ) }
					value={ selectedWidth }
					onChange={ ( newWidth ) =>
						setAttributes( { width: newWidth } )
					}
					isBlock
					__next40pxDefaultSize
					__nextHasNoMarginBottom
				>
					{ [ 25, 50, 75, 100 ].map( ( widthValue ) => {
						return (
							<ToggleGroupControlOption
								key={ widthValue }
								value={ widthValue }
								label={ sprintf(
									/* translators: %d: Percentage value. */
									__( '%d%%' ),
									widthValue
								) }
							/>
						);
					} ) }
				</ToggleGroupControl>
			</ToolsPanelItem>
		</ToolsPanel>
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
		context,
	} = props;
	const {
		tagName,
		linkTarget,
		placeholder,
		rel,
		style,
		text,
		url,
		width,
		metadata,
	} = attributes;
	useDeprecatedTextAlign( props );

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

	const {
		createPageEntity,
		userCanCreatePages,
		lockUrlControls = false,
	} = useSelect(
		( select ) => {
			if ( ! isSelected ) {
				return {};
			}

			const _settings = select( blockEditorStore ).getSettings();

			const blockBindingsSource = getBlockBindingsSource(
				metadata?.bindings?.url?.source
			);

			return {
				createPageEntity: _settings.__experimentalCreatePageEntity,
				userCanCreatePages: _settings.__experimentalUserCanCreatePages,
				lockUrlControls:
					!! metadata?.bindings?.url &&
					! blockBindingsSource?.canUserEditValue?.( {
						select,
						context,
						args: metadata?.bindings?.url?.args,
					} ),
			};
		},
		[ context, isSelected, metadata?.bindings?.url ]
	);

	async function handleCreate( pageTitle ) {
		const page = await createPageEntity( {
			title: pageTitle,
			status: 'draft',
		} );

		return {
			id: page.id,
			type: page.type,
			title: page.title.rendered,
			url: page.link,
			kind: 'post-type',
		};
	}

	function createButtonText( searchTerm ) {
		return createInterpolateElement(
			sprintf(
				/* translators: %s: search term. */
				__( 'Create page: <mark>%s</mark>' ),
				searchTerm
			),
			{ mark: <mark /> }
		);
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

	// Memoize link value to avoid overriding the LinkControl's internal state.
	// This is a temporary fix. See https://github.com/WordPress/gutenberg/issues/51256.
	const linkValue = useMemo(
		() => ( { url, opensInNewTab, nofollow } ),
		[ url, opensInNewTab, nofollow ]
	);

	const useEnterRef = useEnter( { content: text, clientId } );
	const mergedRef = useMergeRefs( [ useEnterRef, richTextRef ] );

	const [ fluidTypographySettings, layout ] = useSettings(
		'typography.fluid',
		'layout'
	);
	const typographyProps = useTypographyProps( attributes, {
		typography: {
			fluid: fluidTypographySettings,
		},
		layout: {
			wideSize: layout?.wideSize,
		},
	} );

	const hasNonContentControls = blockEditingMode === 'default';
	const hasBlockControls =
		hasNonContentControls || ( isLinkTag && ! lockUrlControls );

	return (
		<>
			<div
				{ ...blockProps }
				className={ clsx( blockProps.className, {
					[ `has-custom-width wp-block-button__width-${ width }` ]:
						width,
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
					className={ clsx(
						className,
						'wp-block-button__link',
						colorProps.className,
						borderProps.className,
						typographyProps.className,
						{
							// For backwards compatibility add style that isn't
							// provided via block support.
							'no-border-radius': style?.border?.radius === 0,
							[ `has-custom-font-size` ]:
								blockProps.style.fontSize,
						},
						__experimentalGetElementClassName( 'button' )
					) }
					style={ {
						...borderProps.style,
						...colorProps.style,
						...spacingProps.style,
						...shadowProps.style,
						...typographyProps.style,
						writingMode: undefined,
					} }
					onReplace={ onReplace }
					onMerge={ mergeBlocks }
					identifier="text"
				/>
			</div>
			{ hasBlockControls && (
				<BlockControls group="block">
					{ isLinkTag && ! lockUrlControls && (
						<ToolbarButton
							name="link"
							icon={ ! isURLSet ? link : linkOff }
							title={ ! isURLSet ? __( 'Link' ) : __( 'Unlink' ) }
							shortcut={
								! isURLSet
									? displayShortcut.primary( 'k' )
									: displayShortcut.primaryShift( 'k' )
							}
							onClick={ ! isURLSet ? startEditing : unlink }
							isActive={ isURLSet }
						/>
					) }
				</BlockControls>
			) }
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
							onRemove={ () => {
								unlink();
								richTextRef.current?.focus();
							} }
							forceIsEditingLink={ isEditingURL }
							settings={ LINK_SETTINGS }
							createSuggestion={
								createPageEntity && handleCreate
							}
							withCreateSuggestion={ userCanCreatePages }
							createSuggestionButtonText={ createButtonText }
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
				<HTMLElementControl
					tagName={ tagName }
					onChange={ ( value ) =>
						setAttributes( { tagName: value } )
					}
					options={ [
						{ label: __( 'Default (<a>)' ), value: 'a' },
						{ label: '<button>', value: 'button' },
					] }
				/>
				{ isLinkTag && (
					<TextControl
						__next40pxDefaultSize
						label={ __( 'Link relation' ) }
						help={ createInterpolateElement(
							__(
								'The <a>Link Relation</a> attribute defines the relationship between a linked resource and the current document.'
							),
							{
								a: (
									<ExternalLink href="https://developer.mozilla.org/docs/Web/HTML/Attributes/rel" />
								),
							}
						) }
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
