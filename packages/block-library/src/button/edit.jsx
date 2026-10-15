import clsx from 'clsx';
import { __, sprintf } from '@wordpress/i18n';
import {
	useEffect,
	useState,
	useRef,
	useMemo,
	createInterpolateElement,
} from '@wordpress/element';
import {
	Button,
	TextControl,
	ToolbarButton,
	Popover,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import {
	BlockControls,
	InspectorControls,
	RichText,
	useBlockProps,
	LinkControl,
	__experimentalUseBorderProps as useBorderProps,
	__experimentalUseColorProps as useColorProps,
	useBackgroundProps,
	__experimentalGetSpacingClassesAndStyles as useSpacingProps,
	__experimentalGetShadowClassesAndStyles as useShadowProps,
	__experimentalGetDimensionsClassesAndStyles as useDimensionsProps,
	__experimentalGetElementClassName,
	store as blockEditorStore,
	useBlockEditingMode,
	getTypographyClassesAndStyles as useTypographyProps,
	useSettings,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { displayShortcut, isKeyboardEvent, ENTER } from '@wordpress/keycodes';
import { external, link } from '@wordpress/icons';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import { store as coreStore } from '@wordpress/core-data';
import {
	createBlock,
	cloneBlock,
	getDefaultBlockName,
	getBlockBindingsSource,
} from '@wordpress/blocks';
import {
	useMergeRefs,
	useRefEffect,
	privateApis as composePrivateApis,
} from '@wordpress/compose';
import { useSelect, useDispatch } from '@wordpress/data';
import { CheckboxControl, Link } from '@wordpress/ui';
import { NEW_TAB_TARGET, NOFOLLOW_REL } from './constants';
import { getUpdatedLinkAttributes } from './get-updated-link-attributes';
import removeAnchorTag from '../utils/remove-anchor-tag';
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';
import { useLinkPreview } from '../navigation-link/shared/use-link-preview';
import { getSuggestionsQuery } from '../navigation-link/link-ui';
import { unlock } from '../lock-unlock';
import useDeprecatedTextAlign from '../utils/deprecated-text-align-attributes';
import { getWidthClasses, isPercentageWidth } from './utils';

const { HTMLElementControl, LinkPicker, isHashLink, isRelativePath } = unlock(
	blockEditorPrivateApis
);
const { subscribeDelegatedListener } = unlock( composePrivateApis );

const LINK_SETTINGS = [
	...LinkControl.DEFAULT_LINK_SETTINGS,
	{
		id: 'nofollow',
		title: __( 'Mark as nofollow' ),
	},
];

function useEnter( clientId ) {
	const { replaceBlocks, selectionChange } = useDispatch( blockEditorStore );
	const {
		getBlock,
		getBlockAttributes,
		getBlockRootClientId,
		getBlockIndex,
	} = useSelect( blockEditorStore );

	return useRefEffect( ( element ) => {
		function onKeyDown( event ) {
			if ( event.defaultPrevented || event.keyCode !== ENTER ) {
				return;
			}
			const { text } = getBlockAttributes( clientId ) ?? {};
			if ( text?.length ) {
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

		// Capture phase so we run before writing-flow's ancestor-bubble
		// keydown handlers that gate on `event.defaultPrevented`.
		return subscribeDelegatedListener(
			element,
			'keydown',
			onKeyDown,
			true
		);
	}, [] );
}

/**
 * The content controls shown in the block inspector's Content tab and in the
 * List View popover, mirroring the Navigation Link block's panel.
 *
 * @param {Object}                         props
 * @param {Object}                         props.attributes     Block attributes.
 * @param {( attributes: Object ) => void} props.setAttributes  Updates block attributes.
 * @param {boolean}                        props.isLinkEditable Whether the link fields are shown.
 */
function ContentControls( { attributes, setAttributes, isLinkEditable } ) {
	const { text, url, rel, linkTarget } = attributes;
	const opensInNewTab = linkTarget === NEW_TAB_TARGET;
	const nofollow = !! rel?.includes( NOFOLLOW_REL );
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	const homeUrl = useSelect(
		( select ) =>
			select( coreStore ).getEntityRecord( 'root', '__unstableBase' )
				?.home,
		[]
	);
	const preview = useLinkPreview( { url } );

	// Hash links and relative paths other than site-root paths can't be
	// opened on their own.
	const isViewableUrl =
		!! url &&
		( ! isHashLink( url ) ||
			( isRelativePath( url ) && ! url.startsWith( '/' ) ) );
	const viewUrl =
		isViewableUrl && url.startsWith( '/' ) && homeUrl ? homeUrl + url : url;

	const setLink = ( changes ) =>
		setAttributes(
			getUpdatedLinkAttributes( {
				rel,
				url,
				opensInNewTab,
				nofollow,
				...changes,
			} )
		);

	return (
		<ToolsPanel
			label={ __( 'Settings' ) }
			resetAll={ () =>
				setAttributes( {
					text: '',
					url: undefined,
					linkTarget: undefined,
					rel: undefined,
				} )
			}
			dropdownMenuProps={ dropdownMenuProps }
		>
			<ToolsPanelItem
				hasValue={ () => !! text?.length }
				label={ __( 'Text' ) }
				onDeselect={ () => setAttributes( { text: '' } ) }
				isShownByDefault
			>
				<TextControl
					label={ __( 'Text' ) }
					value={ text ? stripHTML( text.toString() ) : '' }
					onChange={ ( value ) => setAttributes( { text: value } ) }
					autoComplete="off"
				/>
			</ToolsPanelItem>
			{ isLinkEditable && (
				<>
					<ToolsPanelItem
						hasValue={ () => !! url }
						label={ __( 'Link to' ) }
						onDeselect={ () =>
							setAttributes( {
								url: undefined,
								linkTarget: undefined,
								rel: undefined,
							} )
						}
						isShownByDefault
					>
						<LinkPicker
							preview={ preview }
							onSelect={ ( { url: newUrl } ) =>
								setLink( { url: newUrl } )
							}
							// Like a navigation link, offer pages before anything is typed.
							suggestionsQuery={ getSuggestionsQuery() }
							label={ __( 'Link to' ) }
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						hasValue={ () => opensInNewTab }
						label={ __( 'Open in new tab' ) }
						onDeselect={ () => setLink( { opensInNewTab: false } ) }
						isShownByDefault
					>
						<CheckboxControl
							label={ __( 'Open in new tab' ) }
							checked={ opensInNewTab }
							onCheckedChange={ ( value ) =>
								setLink( { opensInNewTab: value } )
							}
						/>
					</ToolsPanelItem>
					{ isViewableUrl && (
						<Button
							variant="secondary"
							href={ viewUrl }
							target="_blank"
							icon={ external }
							iconPosition="right"
							__next40pxDefaultSize
							className="navigation-link-to__action-button"
						>
							{ __( 'View' ) }
						</Button>
					) }
				</>
			) }
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
		metadata,
	} = attributes;
	const width = style?.dimensions?.width;

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
	const backgroundProps = useBackgroundProps( attributes );
	const dimensionsProps = useDimensionsProps( attributes );
	const ref = useRef();
	const richTextRef = useRef();
	const blockProps = useBlockProps( {
		ref: useMergeRefs( [ setPopoverAnchor, ref ] ),
		onKeyDown,
	} );
	const blockEditingMode = useBlockEditingMode();
	// Inside a Navigation block every item edits from a Settings panel, so a
	// Button there gets one too. Elsewhere it appears only in content-only
	// editing, where the toolbar's link controls are hidden.
	const isInsideNavigation = useSelect(
		( select ) =>
			!! select( blockEditorStore ).getBlockParentsByBlockName(
				clientId,
				'core/navigation'
			).length,
		[ clientId ]
	);
	const hasContentControls =
		blockEditingMode === 'contentOnly' || isInsideNavigation;

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

	const useEnterRef = useEnter( clientId );
	const mergedRef = useMergeRefs( [ useEnterRef, richTextRef ] );

	const [ fluidTypographySettings, layout, dimensionSizes ] = useSettings(
		'typography.fluid',
		'layout',
		'dimensions.dimensionSizes'
	);
	const dimensionPresets = useMemo( () => {
		if ( ! dimensionSizes ) {
			return [];
		}
		return [
			...( dimensionSizes?.custom ?? [] ),
			...( dimensionSizes?.theme ?? [] ),
			...( dimensionSizes?.default ?? [] ),
		];
	}, [ dimensionSizes ] );
	const typographyProps = useTypographyProps( attributes, {
		typography: {
			fluid: fluidTypographySettings,
		},
		layout: {
			wideSize: layout?.wideSize,
		},
	} );

	// Resolve preset dimension references to their actual values.
	const resolvedWidth = useMemo( () => {
		if ( ! width ) {
			return undefined;
		}
		const presetPrefix = 'var:preset|dimension|';
		if ( width.startsWith( presetPrefix ) ) {
			const slug = width.slice( presetPrefix.length );
			const preset = dimensionPresets?.find( ( p ) => p.slug === slug );
			return preset?.size ?? width;
		}
		return width;
	}, [ width, dimensionPresets ] );

	const hasNonContentControls = blockEditingMode === 'default';
	const hasBlockControls =
		hasNonContentControls || ( isLinkTag && ! lockUrlControls );
	const classes = clsx(
		blockProps.className,
		getWidthClasses( resolvedWidth )
	);

	const widthStyle = useMemo( () => {
		if ( ! width ) {
			return {};
		}
		if ( isPercentageWidth( resolvedWidth ) ) {
			return {
				'--wp--block-button--width': parseFloat( resolvedWidth ),
			};
		}
		return dimensionsProps.style;
	}, [ width, resolvedWidth, dimensionsProps.style ] );

	return (
		<>
			<div
				{ ...blockProps }
				className={ classes }
				style={ { ...blockProps.style, ...widthStyle } }
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
						backgroundProps.className,
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
						...backgroundProps.style,
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
							icon={ link }
							title={ __( 'Link' ) }
							shortcut={ displayShortcut.primary( 'k' ) }
							onClick={ () => setIsEditingURL( ! isEditingURL ) }
							isActive={ isURLSet }
						/>
					) }
				</BlockControls>
			) }
			{ isLinkTag && isSelected && isEditingURL && ! lockUrlControls && (
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
						forceIsEditingLink={ ! isURLSet }
						settings={ LINK_SETTINGS }
						createSuggestion={ createPageEntity && handleCreate }
						withCreateSuggestion={ userCanCreatePages }
						createSuggestionButtonText={ createButtonText }
					/>
				</Popover>
			) }
			{ hasContentControls && (
				<InspectorControls group="content">
					<ContentControls
						attributes={ attributes }
						setAttributes={ setAttributes }
						isLinkEditable={ isLinkTag && ! lockUrlControls }
					/>
				</InspectorControls>
			) }
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
						label={ __( 'Link relation' ) }
						help={ createInterpolateElement(
							__(
								'The <a>Link Relation</a> attribute defines the relationship between a linked resource and the current document.'
							),
							{
								a: (
									<Link
										openInNewTab
										href="https://developer.mozilla.org/docs/Web/HTML/Attributes/rel"
									/>
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
