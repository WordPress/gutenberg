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
	ToolbarButton,
	Popover,
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
	useBlockBindingsUtils,
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

const { LinkPicker } = unlock( blockEditorPrivateApis );

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
 * Mirrors Navigation Link's logic so the LinkPicker UI matches.
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

function SettingsPanel( { selectedWidth, setAttributes, linkPanel } ) {
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	return (
		<ToolsPanel
			label={ __( 'Settings' ) }
			resetAll={ () => {
				linkPanel?.onReset?.();
				setAttributes( { width: undefined } );
			} }
			dropdownMenuProps={ dropdownMenuProps }
		>
			<ToolsPanelItem
				label={ __( 'Width' ) }
				isShownByDefault
				hasValue={ () => !! selectedWidth }
				onDeselect={ () => setAttributes( { width: undefined } ) }
			>
				<ToggleGroupControl
					label={ __( 'Width' ) }
					value={ selectedWidth }
					onChange={ ( newWidth ) =>
						setAttributes( { width: newWidth } )
					}
					isBlock
					__next40pxDefaultSize
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
	const { updateBlockBindings } = useBlockBindingsUtils( clientId );

	const [ isEditingURL, setIsEditingURL ] = useState( false );
	const opensInNewTab = linkTarget === NEW_TAB_TARGET;
	const nofollow = !! rel?.includes( NOFOLLOW_REL );
	const isLinkTag = 'a' === TagName;

	const urlBinding = metadata?.bindings?.url;
	const isEntityUrlBinding = urlBinding?.source === 'core/entity';
	const isLegacyContextualEntityBinding =
		urlBinding?.source === 'core/post-data' ||
		urlBinding?.source === 'core/term-data';
	const boundEntityArgs = isEntityUrlBinding ? urlBinding?.args : null;

	const resolvedEntityUrl = useSelect(
		( select ) => {
			if ( ! isEntityUrlBinding ) {
				return '';
			}

			const key = boundEntityArgs?.key;
			const kind = boundEntityArgs?.kind;
			const type = boundEntityArgs?.type;
			const id = boundEntityArgs?.id;

			if ( key !== 'url' || ! kind || ! type || ! id ) {
				return '';
			}

			const { getEntityRecord } = select( coreDataStore );

			if ( kind === 'post-type' ) {
				return getEntityRecord( 'postType', type, id )?.link || '';
			}

			if ( kind === 'taxonomy' ) {
				const taxonomySlug = type === 'tag' ? 'post_tag' : type;
				return (
					getEntityRecord( 'taxonomy', taxonomySlug, id )?.link || ''
				);
			}

			return '';
		},
		[ isEntityUrlBinding, boundEntityArgs ]
	);

	// Consider a bound entity as "URL set" even while the URL is resolving.
	const isURLSet = isEntityUrlBinding || !! url || !! resolvedEntityUrl;

	// Cleanup: remove legacy contextual entity bindings on Button.
	// These can incorrectly resolve to the *current* post being edited.
	useEffect( () => {
		if ( isLegacyContextualEntityBinding ) {
			updateBlockBindings( { url: undefined } );
		}
	}, [ isLegacyContextualEntityBinding, updateBlockBindings ] );

	const clearEntityUrlBinding = () => {
		if ( isEntityUrlBinding ) {
			updateBlockBindings( { url: undefined } );
		}
	};

	const createEntityUrlBinding = ( { id, kind, type } ) => {
		if ( ! id || ! kind || ! type ) {
			return;
		}

		updateBlockBindings( {
			url: {
				source: 'core/entity',
				args: {
					key: 'url',
					id,
					kind,
					type,
				},
			},
		} );
	};

	const boundKind = boundEntityArgs?.kind;
	const boundType = boundEntityArgs?.type;
	const boundId = boundEntityArgs?.id;

	const { entityRecord, isBoundEntityAvailable } = useSelect(
		( select ) => {
			if (
				! isEntityUrlBinding ||
				! boundKind ||
				! boundType ||
				! boundId
			) {
				return { entityRecord: null, isBoundEntityAvailable: true };
			}

			const { getEntityRecord, hasFinishedResolution } =
				select( coreDataStore );

			if ( boundKind === 'post-type' ) {
				const record = getEntityRecord(
					'postType',
					boundType,
					boundId
				);
				const hasResolved = hasFinishedResolution( 'getEntityRecord', [
					'postType',
					boundType,
					boundId,
				] );
				return {
					entityRecord: record || null,
					isBoundEntityAvailable: hasResolved
						? record !== undefined
						: true,
				};
			}

			if ( boundKind === 'taxonomy' ) {
				const taxonomySlug =
					boundType === 'tag' ? 'post_tag' : boundType;
				const record = getEntityRecord(
					'taxonomy',
					taxonomySlug,
					boundId
				);
				const hasResolved = hasFinishedResolution( 'getEntityRecord', [
					'taxonomy',
					taxonomySlug,
					boundId,
				] );
				return {
					entityRecord: record || null,
					isBoundEntityAvailable: hasResolved
						? record !== undefined
						: true,
				};
			}

			return { entityRecord: null, isBoundEntityAvailable: true };
		},
		[ isEntityUrlBinding, boundKind, boundType, boundId ]
	);

	const linkPanel = useMemo( () => {
		const previewUrl = isEntityUrlBinding ? resolvedEntityUrl : url;
		const title =
			entityRecord?.title?.rendered ||
			entityRecord?.title ||
			entityRecord?.name ||
			'';
		const typeLabel = isEntityUrlBinding ? boundType : undefined;

		const badges = [];
		if ( previewUrl ) {
			if ( typeLabel ) {
				badges.push( {
					label: capitalize( typeLabel ),
					intent: 'default',
				} );
			}
		}
		if ( ! previewUrl ) {
			badges.push( { label: __( 'No link selected' ), intent: 'error' } );
		} else if ( isEntityUrlBinding && ! isBoundEntityAvailable ) {
			badges.push( { label: __( 'Deleted' ), intent: 'error' } );
		} else if ( entityRecord?.status ) {
			const statusMap = {
				publish: { label: __( 'Published' ), intent: 'success' },
				future: { label: __( 'Scheduled' ), intent: 'warning' },
				draft: { label: __( 'Draft' ), intent: 'warning' },
				pending: { label: __( 'Pending' ), intent: 'warning' },
				private: { label: __( 'Private' ), intent: 'default' },
				trash: { label: __( 'Trash' ), intent: 'error' },
			};
			const badge = statusMap[ entityRecord.status ];
			if ( badge ) {
				badges.push( badge );
			}
		}

		const preview = {
			title: previewUrl
				? title || computePreviewUrl( previewUrl )
				: __( 'Add link' ),
			url: computePreviewUrl( previewUrl ),
			image: null,
			badges,
		};

		const help = isEntityUrlBinding
			? sprintf(
					/* translators: %s is the entity type (e.g., "page", "post", "category") */
					__( 'Synced with the selected %s.' ),
					boundType || __( 'item' )
			  )
			: undefined;

		return {
			hasValue: () => isURLSet,
			onDeselect: () => unlink(),
			onReset: () => unlink(),
			preview,
			suggestionsQuery: getSuggestionsQuery( boundType, boundKind ),
			help,
			onSelect: ( updatedLink ) => {
				if ( ! updatedLink ) {
					return;
				}

				const nextUrl = updatedLink.url;
				const nextOpensInNewTab =
					updatedLink.opensInNewTab ?? opensInNewTab;
				const nextNofollow = updatedLink.nofollow ?? nofollow;

				const updatedLinkAttributes = getUpdatedLinkAttributes( {
					rel,
					url: nextUrl,
					opensInNewTab: nextOpensInNewTab,
					nofollow: nextNofollow,
				} );

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
					setAttributes( {
						...updatedLinkAttributes,
						url: undefined,
					} );
					return;
				}

				clearEntityUrlBinding();
				setAttributes( updatedLinkAttributes );
			},
		};
	}, [
		boundId,
		boundKind,
		boundType,
		clearEntityUrlBinding,
		createEntityUrlBinding,
		entityRecord,
		isBoundEntityAvailable,
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

			return {
				createPageEntity: _settings.__experimentalCreatePageEntity,
				userCanCreatePages: _settings.__experimentalUserCanCreatePages,
				lockUrlControls:
					// Keep controls available for entity-bound button links.
					bindingSourceName !== 'core/entity' &&
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
		clearEntityUrlBinding();
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
	const linkValue = useMemo( () => {
		let entityValue = {};
		if ( isEntityUrlBinding ) {
			entityValue = {
				id: boundEntityArgs?.id,
				kind: boundEntityArgs?.kind,
				type: boundEntityArgs?.type,
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
		boundEntityArgs?.id,
		boundEntityArgs?.kind,
		boundEntityArgs?.type,
	] );

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

								const updatedLinkAttributes =
									getUpdatedLinkAttributes( {
										rel,
										url: newURL,
										opensInNewTab: newOpensInNewTab,
										nofollow: newNofollow,
									} );

								const hasEntitySelection = !! (
									id &&
									kind &&
									type
								);
								const isSameAsBoundEntityUrl =
									isEntityUrlBinding &&
									resolvedEntityUrl &&
									newURL === resolvedEntityUrl;

								// If the user typed a URL that differs from the bound entity URL,
								// treat it as an "unlink" operation without changing the UI.
								if (
									isEntityUrlBinding &&
									newURL &&
									resolvedEntityUrl &&
									! isSameAsBoundEntityUrl
								) {
									clearEntityUrlBinding();
									setAttributes( updatedLinkAttributes );
									return;
								}

								if ( hasEntitySelection ) {
									// Create/refresh entity binding and avoid persisting a static URL attribute.
									createEntityUrlBinding( {
										id,
										kind,
										type,
									} );
									setAttributes( {
										...updatedLinkAttributes,
										url: undefined,
									} );
									return;
								}

								// Static URL: clear any entity binding and persist the URL.
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
				<SettingsPanel
					selectedWidth={ width }
					setAttributes={ setAttributes }
					linkPanel={ isLinkTag ? linkPanel : null }
				/>
			</InspectorControls>
		</>
	);
}

export default ButtonEdit;
