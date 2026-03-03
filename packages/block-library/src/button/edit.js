import clsx from 'clsx';
import { __, sprintf } from '@wordpress/i18n';
import {
	useEffect,
	useState,
	useRef,
	useMemo,
	useCallback,
	createInterpolateElement,
} from '@wordpress/element';
import {
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
import { link, linkOff } from '@wordpress/icons';
import {
	createBlock,
	cloneBlock,
	getDefaultBlockName,
	getBlockBindingsSource,
} from '@wordpress/blocks';
import { useMergeRefs, useRefEffect } from '@wordpress/compose';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreDataStore } from '@wordpress/core-data';
import { NEW_TAB_TARGET, NOFOLLOW_REL } from './constants';
import { getUpdatedLinkAttributes } from './get-updated-link-attributes';
import removeAnchorTag from '../utils/remove-anchor-tag';
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';
import { unlock } from '../lock-unlock';
import useDeprecatedTextAlign from '../utils/deprecated-text-align-attributes';
import { getWidthClasses, isPercentageWidth } from './utils';

const { HTMLElementControl, LinkPicker } = unlock( blockEditorPrivateApis );

/**
 * Capitalize the first letter of a string.
 *
 * @param {string} str String to capitalize.
 * @return {string} Capitalized string.
 */
function capitalize( str ) {
	return str.charAt( 0 ).toUpperCase() + str.slice( 1 );
}

/**
 * Compute preview URL for LinkPicker - strips site URL if internal.
 *
 * @param {string} url URL to process.
 * @return {string} Display URL.
 */
function computePreviewUrl( url ) {
	if ( ! url ) {
		return '';
	}

	try {
		const linkUrl = new URL( url );
		const siteUrl = window.location.origin;
		if ( linkUrl.origin === siteUrl ) {
			let path = linkUrl.pathname + linkUrl.search + linkUrl.hash;
			if ( path.endsWith( '/' ) && path.length > 1 ) {
				path = path.slice( 0, -1 );
			}
			return path;
		}
	} catch ( e ) {
		// fall through
	}

	return url;
}

/**
 * Given a selected entity type/kind, return the query params for /wp/v2/search.
 *
 * @param {string} type Entity type.
 * @param {string} kind Entity kind.
 * @return {Object} Query params.
 */
function getSuggestionsQuery( type, kind ) {
	switch ( type ) {
		case 'post':
		case 'page':
			return { type: 'post', subtype: type };
		case 'category':
			return { type: 'term', subtype: 'category' };
		case 'tag':
			return { type: 'term', subtype: 'post_tag' };
		case 'post_format':
			return { type: 'post-format' };
		default:
			if ( kind === 'taxonomy' ) {
				return { type: 'term', subtype: type };
			}
			if ( kind === 'post-type' ) {
				return { type: 'post', subtype: type };
			}
			return {
				// For custom link which has no type, always show pages as initial suggestions.
				initialSuggestionsSearchOptions: {
					type: 'post',
					subtype: 'page',
					perPage: 20,
				},
			};
	}
}

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

function SettingsPanel( { linkPanel } ) {
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	return (
		<ToolsPanel
			label={ __( 'Settings' ) }
			resetAll={ () => {
				linkPanel?.onReset?.();
			} }
			dropdownMenuProps={ dropdownMenuProps }
		>
			{ linkPanel && (
				<ToolsPanelItem
					label={ __( 'Link to' ) }
					hasValue={ linkPanel.hasValue }
					onDeselect={ linkPanel.onDeselect }
					isShownByDefault
				>
					<LinkPicker
						preview={ linkPanel.preview }
						onSelect={ linkPanel.onSelect }
						suggestionsQuery={ linkPanel.suggestionsQuery }
						label={ __( 'Link to' ) }
						help={ linkPanel.help }
					/>
				</ToolsPanelItem>
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
	const dimensionsProps = useDimensionsProps( attributes );
	const richTextRef = useRef();
	const blockProps = useBlockProps( {
		ref: useMergeRefs( [ setPopoverAnchor ] ),
		onKeyDown,
	} );
	const blockEditingMode = useBlockEditingMode();

	const [ isEditingURL, setIsEditingURL ] = useState( false );
	const opensInNewTab = linkTarget === NEW_TAB_TARGET;
	const nofollow = !! rel?.includes( NOFOLLOW_REL );
	const isLinkTag = 'a' === TagName;

	// Entity binding uses core/post-data and core/term-data sources (like Navigation Link).
	// Entity info (id, kind, type) is stored in metadata for Button block.
	const urlBinding = metadata?.bindings?.url;
	const isEntityUrlBinding =
		urlBinding?.source === 'core/post-data' ||
		urlBinding?.source === 'core/term-data';
	const boundEntityId = metadata?.id;
	const boundEntityKind = metadata?.kind;
	const boundEntityType = metadata?.type;

	const { resolvedEntityUrl } = useSelect(
		( select ) => {
			if (
				! isEntityUrlBinding ||
				! boundEntityId ||
				! boundEntityKind ||
				! boundEntityType
			) {
				return {
					resolvedEntityUrl: '',
				};
			}

			const { getEntityRecord } = select( coreDataStore );

			if ( boundEntityKind === 'post-type' ) {
				const record = getEntityRecord(
					'postType',
					boundEntityType,
					boundEntityId
				);
				return {
					resolvedEntityUrl: record?.link || '',
				};
			}

			if ( boundEntityKind === 'taxonomy' ) {
				const taxonomySlug =
					boundEntityType === 'tag' ? 'post_tag' : boundEntityType;
				const record = getEntityRecord(
					'taxonomy',
					taxonomySlug,
					boundEntityId
				);
				return {
					resolvedEntityUrl: record?.link || '',
				};
			}

			return {
				resolvedEntityUrl: '',
			};
		},
		[ isEntityUrlBinding, boundEntityId, boundEntityKind, boundEntityType ]
	);

	// Consider a bound entity as "URL set" even while the URL is resolving.
	const isURLSet = isEntityUrlBinding || !! url || !! resolvedEntityUrl;

	const clearEntityUrlBinding = useCallback( () => {
		if ( ! isEntityUrlBinding ) {
			return;
		}
		// Clear binding and entity metadata
		const { bindings, ...restMetadata } = metadata || {};
		if ( bindings?.url ) {
			const { url: _urlBinding, ...restBindings } = bindings;
			if ( Object.keys( restBindings ).length > 0 ) {
				setAttributes( {
					metadata: {
						...restMetadata,
						bindings: restBindings,
					},
				} );
			} else if ( Object.keys( restMetadata ).length > 0 ) {
				setAttributes( { metadata: restMetadata } );
			} else {
				setAttributes( { metadata: undefined } );
			}
		}
	}, [ isEntityUrlBinding, metadata, setAttributes ] );

	const createEntityUrlBinding = useCallback(
		( { id, kind, type } ) => {
			if ( ! id || ! kind || ! type ) {
				return;
			}

			const source =
				kind === 'taxonomy' ? 'core/term-data' : 'core/post-data';

			setAttributes( {
				metadata: {
					...metadata,
					id,
					kind,
					type,
					bindings: {
						...metadata?.bindings,
						url: {
							source,
							args: {
								field: 'link',
							},
						},
					},
				},
				url: undefined,
			} );
		},
		[ metadata, setAttributes ]
	);

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

			const bindingSourceName = metadata?.bindings?.url?.source;
			const blockBindingsSource =
				getBlockBindingsSource( bindingSourceName );

			// Entity bindings (core/post-data, core/term-data) should not lock controls
			const isEntityBinding =
				bindingSourceName === 'core/post-data' ||
				bindingSourceName === 'core/term-data';

			return {
				createPageEntity: _settings.__experimentalCreatePageEntity,
				userCanCreatePages: _settings.__experimentalUserCanCreatePages,
				lockUrlControls:
					! isEntityBinding &&
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

	const unlink = useCallback( () => {
		clearEntityUrlBinding();
		setAttributes( {
			url: undefined,
			linkTarget: undefined,
			rel: undefined,
		} );
		setIsEditingURL( false );
	}, [ clearEntityUrlBinding, setAttributes ] );

	useEffect( () => {
		if ( ! isSelected ) {
			setIsEditingURL( false );
		}
	}, [ isSelected ] );

	// Memoize link value to avoid overriding the LinkControl's internal state.
	// This is a temporary fix. See https://github.com/WordPress/gutenberg/issues/51256.
	const linkValue = useMemo( () => {
		let entityValue = {};
		if ( isEntityUrlBinding ) {
			entityValue = {
				id: boundEntityId,
				kind: boundEntityKind,
				type: boundEntityType,
			};
		}

		return {
			// For bound entities we rely on the dynamically resolved URL.
			url: isEntityUrlBinding ? resolvedEntityUrl : url,
			opensInNewTab,
			nofollow,
			...entityValue,
		};
	}, [
		url,
		resolvedEntityUrl,
		opensInNewTab,
		nofollow,
		isEntityUrlBinding,
		boundEntityId,
		boundEntityKind,
		boundEntityType,
	] );

	const useEnterRef = useEnter( { content: text, clientId } );
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

	const linkPanel = useMemo( () => {
		const previewUrl = isEntityUrlBinding ? resolvedEntityUrl : url;
		const title =
			resolvedEntityUrl && boundEntityType
				? capitalize( boundEntityType )
				: '';

		const badges = [];
		if ( previewUrl ) {
			if ( title ) {
				badges.push( {
					label: title,
					intent: 'default',
				} );
			}
		}
		if ( ! previewUrl ) {
			badges.push( { label: __( 'No link selected' ), intent: 'error' } );
		}

		const preview = {
			title: previewUrl
				? computePreviewUrl( previewUrl )
				: __( 'Add link' ),
			url: computePreviewUrl( previewUrl ),
			image: null,
			badges,
		};

		const help = isEntityUrlBinding
			? sprintf(
					/* translators: %s is the entity type (e.g., "page", "post", "category") */
					__( 'Synced with the selected %s.' ),
					boundEntityType || __( 'item' )
			  )
			: undefined;

		return {
			hasValue: () => isURLSet,
			onDeselect: () => unlink(),
			onReset: () => unlink(),
			preview,
			suggestionsQuery: getSuggestionsQuery(
				boundEntityType,
				boundEntityKind
			),
			help,
			onSelect: ( updatedLink ) => {
				if ( ! updatedLink ) {
					return;
				}

				const hasEntitySelection = !! (
					updatedLink.id &&
					updatedLink.kind &&
					updatedLink.type
				);

				if ( hasEntitySelection ) {
					createEntityUrlBinding( {
						id: updatedLink.id,
						kind: updatedLink.kind,
						type: updatedLink.type,
					} );
					return;
				}

				const updatedLinkAttributes = getUpdatedLinkAttributes( {
					rel,
					url: updatedLink.url,
					opensInNewTab: updatedLink.opensInNewTab ?? opensInNewTab,
					nofollow: updatedLink.nofollow ?? nofollow,
				} );

				clearEntityUrlBinding();
				setAttributes( updatedLinkAttributes );
			},
		};
	}, [
		boundEntityKind,
		boundEntityType,
		clearEntityUrlBinding,
		createEntityUrlBinding,
		isEntityUrlBinding,
		isURLSet,
		nofollow,
		opensInNewTab,
		rel,
		resolvedEntityUrl,
		setAttributes,
		unlink,
		url,
	] );

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
							handleEntities
							onChange={ ( nextValue ) => {
								const {
									url: newURL,
									opensInNewTab: newOpensInNewTab,
									nofollow: newNofollow,
									id,
									kind,
									type,
								} = nextValue || {};

								const hasEntitySelection = !! (
									id &&
									kind &&
									type
								);

								if ( hasEntitySelection ) {
									createEntityUrlBinding( {
										id,
										kind,
										type,
									} );
									return;
								}

								const updatedLinkAttributes =
									getUpdatedLinkAttributes( {
										rel,
										url: newURL,
										opensInNewTab:
											newOpensInNewTab ?? opensInNewTab,
										nofollow: newNofollow ?? nofollow,
									} );

								clearEntityUrlBinding();
								setAttributes( updatedLinkAttributes );
							} }
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
				<SettingsPanel linkPanel={ isLinkTag ? linkPanel : null } />
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
			</InspectorControls>
		</>
	);
}

export default ButtonEdit;
