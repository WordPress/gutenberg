import {
	Button,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	CheckboxControl as WCCheckboxControl,
	TextControl,
	TextareaControl as WCTextareaControl,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import {
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { external } from '@wordpress/icons';
import { useToolsPanelDropdownMenuProps } from '../../utils/hooks';
import { useHandleLinkChange } from './use-handle-link-change';
import { useEntityBinding } from './use-entity-binding';
import { getSuggestionsQuery } from '../link-ui';
import { useLinkPreview } from './use-link-preview';
import { useIsInvalidLink } from './use-is-invalid-link';
import { unlock } from '../../lock-unlock';

const { LinkPicker, isHashLink, isRelativePath } = unlock(
	blockEditorPrivateApis
);

/**
 * Get a human-readable entity type name.
 *
 * @param {string} type - The entity type
 * @param {string} kind - The entity kind
 * @return {string} Human-readable entity type name
 */
function getEntityTypeName( type, kind ) {
	if ( kind === 'post-type' ) {
		switch ( type ) {
			case 'post':
				return __( 'post' );
			case 'page':
				return __( 'page' );
			default:
				return type || __( 'post' );
		}
	}
	if ( kind === 'taxonomy' ) {
		switch ( type ) {
			case 'category':
				return __( 'category' );
			case 'tag':
				return __( 'tag' );
			default:
				return type || __( 'term' );
		}
	}
	return type || __( 'item' );
}

/**
 * Shared Controls component for Navigation Link and Navigation Submenu blocks.
 *
 * This component provides the inspector controls (ToolsPanel) that are identical
 * between both navigation blocks.
 *
 * @param {Object}   props                - Component props
 * @param {Object}   props.attributes     - Block attributes
 * @param {Function} props.setAttributes  - Function to update block attributes
 * @param {string}   props.clientId       - Block client ID
 * @param {boolean}  props.isLinkEditable - Whether link editing should be allowed
 */
export function Controls( {
	attributes,
	setAttributes,
	clientId,
	isLinkEditable = true,
} ) {
	const { label, url, description, rel, opensInNewTab } = attributes;
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	// Use the entity binding hook for UI state (help text, link preview, etc.)
	const { hasUrlBinding, isBoundEntityAvailable, entityRecord } =
		useEntityBinding( {
			clientId,
			attributes,
		} );

	const [ isInvalid, isDraft ] = useIsInvalidLink(
		attributes.kind,
		attributes.type,
		entityRecord?.id,
		hasUrlBinding
	);

	const homeUrl = useSelect( ( select ) => {
		return select( coreStore ).getEntityRecord( 'root', '__unstableBase' )
			?.home;
	}, [] );

	let helpText = '';

	if ( isInvalid || ( hasUrlBinding && ! isBoundEntityAvailable ) ) {
		// Show invalid link help text for:
		// 1. Invalid post-type links (trashed/deleted posts/pages) - via useIsInvalidLink
		// 2. Missing bound taxonomy entities (deleted categories/tags) - useIsInvalidLink only checks post-types
		helpText = getInvalidLinkHelpText();
	} else if ( isDraft ) {
		helpText = getDraftHelpText( {
			type: attributes.type,
			kind: attributes.kind,
		} );
	} else if (
		attributes.kind === 'custom' &&
		isSameSiteUrl( url, homeUrl )
	) {
		// A custom (URL-only) link to a page on this site has no entity ID
		// attached, so it can never be marked as the current menu item.
		// Surface that here since it looks identical to an entity link
		// otherwise, both while editing and on the front end.
		helpText = getCustomUrlHelpText();
	}
	// Get the link change handler with built-in binding management
	const handleLinkChange = useHandleLinkChange( {
		clientId,
		attributes,
		setAttributes,
	} );

	const onNavigateToEntityRecord = useSelect(
		( select ) =>
			select( blockEditorStore ).getSettings().onNavigateToEntityRecord,
		[]
	);

	const blockEditingMode = useSelect(
		( select ) =>
			select( blockEditorStore ).getBlockEditingMode( clientId ),
		[ clientId ]
	);

	const isContentOnly = blockEditingMode === 'contentOnly';

	const preview = useLinkPreview( {
		url,
		entityRecord,
		type: attributes.type,
		hasBinding: hasUrlBinding,
		isEntityAvailable: isBoundEntityAvailable,
	} );

	// Check if URL is viewable (not hash link or other relative path like ./ or ../)
	const isViewableUrl =
		!! url &&
		( ! isHashLink( url ) ||
			( isRelativePath( url ) && ! url.startsWith( '/' ) ) );

	// Construct full URL for viewing (prepend home URL for absolute paths starting with /)
	const viewUrl =
		isViewableUrl && url.startsWith( '/' ) && homeUrl ? homeUrl + url : url;

	return (
		<ToolsPanel
			label={ __( 'Settings' ) }
			resetAll={ () => {
				setAttributes( {
					label: '',
					url: '',
					description: '',
					rel: '',
					opensInNewTab: false,
				} );
			} }
			dropdownMenuProps={ dropdownMenuProps }
		>
			<ToolsPanelItem
				hasValue={ () => !! label }
				label={ __( 'Text' ) }
				onDeselect={ () => setAttributes( { label: '' } ) }
				isShownByDefault
			>
				<TextControl
					label={ __( 'Text' ) }
					value={ label ? stripHTML( label ) : '' }
					onChange={ ( labelValue ) => {
						setAttributes( { label: labelValue } );
					} }
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
								id: undefined,
								kind: undefined,
								type: undefined,
							} )
						}
						isShownByDefault
					>
						<LinkPicker
							preview={ preview }
							onSelect={ handleLinkChange }
							suggestionsQuery={ getSuggestionsQuery(
								attributes.type,
								attributes.kind
							) }
							label={ __( 'Link to' ) }
							help={ helpText ? helpText : undefined }
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						hasValue={ () => !! opensInNewTab }
						label={ __( 'Open in new tab' ) }
						onDeselect={ () =>
							setAttributes( { opensInNewTab: false } )
						}
						isShownByDefault
					>
						<WCCheckboxControl
							label={ __( 'Open in new tab' ) }
							checked={ opensInNewTab }
							onChange={ ( value ) =>
								setAttributes( { opensInNewTab: value } )
							}
						/>
					</ToolsPanelItem>

					{ !! url &&
						hasUrlBinding &&
						isBoundEntityAvailable &&
						entityRecord?.id &&
						attributes.kind === 'post-type' &&
						onNavigateToEntityRecord && (
							<Button
								variant="secondary"
								onClick={ () => {
									onNavigateToEntityRecord( {
										postId: entityRecord.id,
										postType: attributes.type,
									} );
								} }
								__next40pxDefaultSize
								className="navigation-link-to__action-button"
							>
								{ __( 'Edit' ) }
							</Button>
						) }
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

			<ToolsPanelItem
				hasValue={ () => !! description }
				label={ __( 'Description' ) }
				onDeselect={ () => setAttributes( { description: '' } ) }
				isShownByDefault={ ! isContentOnly }
			>
				<WCTextareaControl
					label={ __( 'Description' ) }
					value={ description || '' }
					onChange={ ( descriptionValue ) => {
						setAttributes( { description: descriptionValue } );
					} }
					help={ __(
						'The description will be displayed in the menu if the current theme supports it.'
					) }
				/>
			</ToolsPanelItem>

			<ToolsPanelItem
				hasValue={ () => !! rel }
				label={ __( 'Rel attribute' ) }
				onDeselect={ () => setAttributes( { rel: '' } ) }
				isShownByDefault={ ! isContentOnly }
			>
				<TextControl
					label={ __( 'Rel attribute' ) }
					value={ rel || '' }
					onChange={ ( relValue ) => {
						setAttributes( { rel: relValue } );
					} }
					autoComplete="off"
					help={ __(
						'The relationship of the linked URL as space-separated link types.'
					) }
				/>
			</ToolsPanelItem>
		</ToolsPanel>
	);
}
/**
 * Returns help text for invalid links.
 *
 * @return {string} Error help text string (empty string if valid).
 */
export function getInvalidLinkHelpText() {
	return __(
		'This link is invalid and will not appear on your site. Please update the link.'
	);
}

/**
 * Returns the help text for links to draft entities
 *
 * @param {Object} props      - Function props
 * @param {string} props.type - The entity type
 * @param {string} props.kind - The entity kind
 * @return {string} Draft help text
 */
function getDraftHelpText( { type, kind } ) {
	const entityType = getEntityTypeName( type, kind );
	return sprintf(
		/* translators: %1$s is the entity type (e.g., "page", "post", "category") */
		__(
			'This link is to a draft %1$s and will not appear on your site until the %1$s is published.'
		),
		entityType
	);
}

/**
 * Returns the help text shown when a custom (URL-only) link points at a page
 * on this site.
 *
 * @return {string} Custom URL help text.
 */
function getCustomUrlHelpText() {
	return __(
		"This is a custom URL, not a link to an existing page, post, category, or tag. It won't be marked as the current menu item when visitors are on this page."
	);
}

/**
 * Determines whether a URL points at a page on this site, so that a custom
 * (URL-only) link to it is worth flagging as never getting current-menu-item
 * highlighting. Returns `false` for external URLs, `mailto:`/`tel:` links,
 * and plain hash links, since none of those are expected to be "the current
 * page" in the first place.
 *
 * @param {string}      url     The URL to check.
 * @param {string|void} homeUrl The site's home URL.
 * @return {boolean} Whether the URL is same-site.
 */
function isSameSiteUrl( url, homeUrl ) {
	if ( ! url || isHashLink( url ) ) {
		return false;
	}

	if ( isRelativePath( url ) ) {
		return true;
	}

	if ( ! homeUrl ) {
		return false;
	}

	try {
		return new URL( url, homeUrl ).origin === new URL( homeUrl ).origin;
	} catch {
		return false;
	}
}
