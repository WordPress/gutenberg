/**
 * WordPress dependencies
 */
import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	CheckboxControl,
	TextControl,
	TextareaControl,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../../utils/hooks';
import { useHandleLinkChange } from './use-handle-link-change';
import { useEntityBinding } from './use-entity-binding';
import { getSuggestionsQuery } from '../link-ui';
import { useLinkPreview } from './use-link-preview';
import { useIsInvalidLink } from './use-is-invalid-link';
import { unlock } from '../../lock-unlock';

const { LinkPicker } = unlock( blockEditorPrivateApis );

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
 * @param {Object}   props               - Component props
 * @param {Object}   props.attributes    - Block attributes
 * @param {Function} props.setAttributes - Function to update block attributes
 * @param {string}   props.clientId      - Block client ID
 */
export function Controls( { attributes, setAttributes, clientId } ) {
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
	}
	// Get the link change handler with built-in binding management
	const handleLinkChange = useHandleLinkChange( {
		clientId,
		attributes,
		setAttributes,
	} );

	const linkTitle =
		entityRecord?.title?.rendered ||
		entityRecord?.title ||
		entityRecord?.name;

	const linkImage = useSelect(
		( select ) => {
			// Only fetch for post-type entities with featured media
			if ( ! entityRecord?.featured_media ) {
				return null;
			}

			const { getEntityRecord } = select( coreStore );

			// Get the media entity to fetch the image URL
			const media = getEntityRecord(
				'postType',
				'attachment',
				entityRecord.featured_media
			);

			// Return the thumbnail or medium size URL, fallback to source_url
			return (
				media?.media_details?.sizes?.thumbnail?.source_url ||
				media?.media_details?.sizes?.medium?.source_url ||
				media?.source_url ||
				null
			);
		},
		[ entityRecord?.featured_media ]
	);

	const preview = useLinkPreview( {
		url,
		title: linkTitle,
		image: linkImage,
		type: attributes.type,
		entityStatus: entityRecord?.status,
		hasBinding: hasUrlBinding,
		isEntityAvailable: isBoundEntityAvailable,
	} );

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
					__next40pxDefaultSize
					label={ __( 'Text' ) }
					value={ label ? stripHTML( label ) : '' }
					onChange={ ( labelValue ) => {
						setAttributes( { label: labelValue } );
					} }
					autoComplete="off"
				/>
			</ToolsPanelItem>

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
				onDeselect={ () => setAttributes( { opensInNewTab: false } ) }
				isShownByDefault
			>
				<CheckboxControl
					label={ __( 'Open in new tab' ) }
					checked={ opensInNewTab }
					onChange={ ( value ) =>
						setAttributes( { opensInNewTab: value } )
					}
				/>
			</ToolsPanelItem>

			<ToolsPanelItem
				hasValue={ () => !! description }
				label={ __( 'Description' ) }
				onDeselect={ () => setAttributes( { description: '' } ) }
				isShownByDefault
			>
				<TextareaControl
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
				isShownByDefault
			>
				<TextControl
					__next40pxDefaultSize
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
