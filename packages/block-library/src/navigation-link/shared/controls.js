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
import { useRef } from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../../utils/hooks';
import { updateAttributes } from './update-attributes';
import { useEntityBinding } from './use-entity-binding';
import { unlock } from '../../lock-unlock';

const { LinkControlInspector } = unlock( blockEditorPrivateApis );

/**
 * Given the Link block's type attribute, return the query params for link suggestions.
 *
 * @param {string} type - Link block's type attribute
 * @param {string} kind - Link block's entity kind (post-type|taxonomy)
 * @return {Object} Search query params
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
			return {};
	}
}

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
	const shouldFocusUnsyncButtonRef = useRef( false );
	const linkContainerRef = useRef();
	const inputId = useInstanceId( Controls, 'link-input' );
	const helpTextId = `${ inputId }__help`;

	// Use the entity binding hook internally
	const {
		hasUrlBinding,
		isBoundEntityAvailable,
		entityRecord,
		createBinding,
	} = useEntityBinding( {
		clientId,
		attributes,
	} );

	// Extract title from entity record
	const title =
		entityRecord?.title?.rendered ||
		entityRecord?.title ||
		entityRecord?.name ||
		null;

	// Fetch featured image for post-type entities
	const featuredImage = useSelect(
		( select ) => {
			// Only fetch for post-type entities with featured media
			if (
				! entityRecord ||
				attributes.kind !== 'post-type' ||
				! entityRecord.featured_media
			) {
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
		[ entityRecord, attributes.kind ]
	);

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
					__nextHasNoMarginBottom
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
				ref={ linkContainerRef }
				hasValue={ () => !! url }
				label={ __( 'Link to' ) }
				onDeselect={ () => setAttributes( { url: '' } ) }
				isShownByDefault
			>
				<LinkControlInspector
					link={ {
						url,
						label,
						kind: attributes.kind,
						type: attributes.type,
						id: attributes.id,
					} }
					title={ title }
					featuredImage={ featuredImage }
					hasEntityBinding={ hasUrlBinding }
					isBoundEntityAvailable={ isBoundEntityAvailable }
					onSelect={ ( suggestion ) => {
						// When a suggestion is selected (or Enter pressed)
						if ( suggestion ) {
							const attrs = {
								url: suggestion.url,
								kind: suggestion.kind,
								type: suggestion.type,
								id: suggestion.id,
							};
							updateAttributes(
								attrs,
								setAttributes,
								attributes
							);
							// Create entity binding if we have entity data
							if ( suggestion.id ) {
								createBinding( attrs );
								shouldFocusUnsyncButtonRef.current = true;
							}
						}
					} }
					suggestionsQuery={ getSuggestionsQuery(
						attributes.type,
						attributes.kind
					) }
					label={ __( 'Link to' ) }
					inputId={ inputId }
					helpTextId={ helpTextId }
					helpText={
						<MissingEntityHelpText
							type={ attributes.type }
							kind={ attributes.kind }
						/>
					}
				/>
			</ToolsPanelItem>

			<ToolsPanelItem
				hasValue={ () => !! opensInNewTab }
				label={ __( 'Open in new tab' ) }
				onDeselect={ () => setAttributes( { opensInNewTab: false } ) }
				isShownByDefault
			>
				<CheckboxControl
					__nextHasNoMarginBottom
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
					__nextHasNoMarginBottom
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
					__nextHasNoMarginBottom
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
 * Component to display help text for bound URL attributes.
 *
 * @param {Object} props      - Component props
 * @param {string} props.type - The entity type
 * @param {string} props.kind - The entity kind
 * @return {string} Help text for the bound URL
 */
export function BindingHelpText( { type, kind } ) {
	const entityType = getEntityTypeName( type, kind );
	return sprintf(
		/* translators: %s is the entity type (e.g., "page", "post", "category") */
		__( 'Synced with the selected %s.' ),
		entityType
	);
}

/**
 * Component to display error help text for missing entity bindings.
 *
 * @param {Object} props      - Component props
 * @param {string} props.type - The entity type
 * @param {string} props.kind - The entity kind
 * @return {JSX.Element} Error help text component
 */
export function MissingEntityHelpText( { type, kind } ) {
	const entityType = getEntityTypeName( type, kind );
	return sprintf(
		/* translators: %s is the entity type (e.g., "page", "post", "category") */
		__( 'Synced %s is missing. Please update or remove this link.' ),
		entityType
	);
}
