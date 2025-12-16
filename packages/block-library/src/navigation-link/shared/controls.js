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
import { __ } from '@wordpress/i18n';
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

	const helpText = InvalidLinkHelpText( {
		invalid: isInvalid || ( hasUrlBinding && ! isBoundEntityAvailable ),
		draft: isDraft,
	} );

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
				onDeselect={ () => setAttributes( { url: '' } ) }
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
 * Returns help text for invalid or draft navigation links.
 *
 * @param {Object}  props         - Component props
 * @param {boolean} props.invalid - Whether the link is invalid (deleted or trashed).
 * @param {boolean} props.draft   - Whether the link is a draft.
 * @return {string} Error help text string (empty string if valid).
 */
export function InvalidLinkHelpText( { invalid, draft } ) {
	if ( invalid ) {
		return __(
			'This link is invalid and will not appear on your site. Please update the link.'
		);
	} else if ( draft ) {
		return __(
			'This link is to a draft page, and will not appear on your site until it is published.'
		);
	}

	return '';
}
