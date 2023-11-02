/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import {
	safeDecodeURIComponent,
	filterURLForDisplay,
	cleanForSlug,
} from '@wordpress/url';
import { useState, useMemo } from '@wordpress/element';
import { __experimentalInspectorPopoverHeader as InspectorPopoverHeader } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import {
	TextControl,
	ExternalLink,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalText as Text,
	Dropdown,
	Button,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';

export const PERMALINK_POSTNAME_REGEX = /%(?:postname|pagename)%/;

function getPostPermalink( record, isEditable ) {
	if ( ! record?.permalink_template ) {
		return;
	}
	const slug = record?.slug || record?.generated_slug;
	const [ prefix, suffix ] = record.permalink_template.split(
		PERMALINK_POSTNAME_REGEX
	);
	const permalink = isEditable ? prefix + slug + suffix : prefix;
	return filterURLForDisplay( safeDecodeURIComponent( permalink ) );
}

export default function PageSlug( { postType, postId } ) {
	const { editEntityRecord } = useDispatch( coreStore );
	const { record, savedSlug } = useSelect(
		( select ) => {
			const { getEntityRecord, getEditedEntityRecord } =
				select( coreStore );
			const savedRecord = getEntityRecord( 'postType', postType, postId, {
				_fields: 'slug,generated_slug',
			} );
			return {
				record: getEditedEntityRecord( 'postType', postType, postId ),
				savedSlug: savedRecord?.slug || savedRecord?.generated_slug,
			};
		},
		[ postType, postId ]
	);
	const [ popoverAnchor, setPopoverAnchor ] = useState( null );
	const [ forceEmptyField, setForceEmptyField ] = useState( false );
	const isEditable =
		PERMALINK_POSTNAME_REGEX.test( record?.permalink_template ) &&
		record?._links?.[ 'wp:action-publish' ];
	const viewPostLabel = useSelect(
		( select ) => {
			const postTypeObject = select( coreStore ).getPostType( postType );
			return postTypeObject?.labels.view_item;
		},
		[ postType ]
	);
	const popoverProps = useMemo(
		() => ( {
			// Anchor the popover to the middle of the entire row so that it doesn't
			// move around when the label changes.
			anchor: popoverAnchor,
			'aria-label': __( 'Change slug' ),
			placement: 'bottom-end',
		} ),
		[ popoverAnchor ]
	);
	if ( ! record ) {
		return null;
	}
	const recordSlug = safeDecodeURIComponent(
		record?.slug || record?.generated_slug
	);
	const permaLink = getPostPermalink( record, isEditable );
	const onSlugChange = ( newValue ) => {
		editEntityRecord( 'postType', postType, postId, {
			slug: newValue,
		} );
	};
	return (
		<HStack className="edit-site-summary-field">
			<Text className="edit-site-summary-field__label">
				{ __( 'URL' ) }
			</Text>
			<Dropdown
				contentClassName="edit-site-page-panels-edit-slug__dropdown"
				popoverProps={ popoverProps }
				focusOnMount
				ref={ setPopoverAnchor }
				renderToggle={ ( { onToggle } ) => (
					<Button
						className="edit-site-summary-field__trigger"
						variant="tertiary"
						onClick={ onToggle }
					>
						{ permaLink }
					</Button>
				) }
				renderContent={ ( { onClose } ) => {
					return (
						<>
							<InspectorPopoverHeader
								title={ __( 'URL' ) }
								onClose={ onClose }
							/>
							<VStack spacing={ 5 }>
								{ isEditable && (
									<TextControl
										__nextHasNoMarginBottom
										label={ __( 'Permalink' ) }
										value={
											forceEmptyField ? '' : recordSlug
										}
										autoComplete="off"
										spellCheck="false"
										help={
											<>
												{ __(
													'The last part of the URL.'
												) }{ ' ' }
												<ExternalLink
													href={ __(
														'https://wordpress.org/documentation/article/page-post-settings-sidebar/#permalink'
													) }
												>
													{ __( 'Learn more.' ) }
												</ExternalLink>
											</>
										}
										onChange={ ( newValue ) => {
											onSlugChange( newValue );
											// When we delete the field the permalink gets
											// reverted to the original value.
											// The forceEmptyField logic allows the user to have
											// the field temporarily empty while typing.
											if ( ! newValue ) {
												if ( ! forceEmptyField ) {
													setForceEmptyField( true );
												}
												return;
											}
											if ( forceEmptyField ) {
												setForceEmptyField( false );
											}
										} }
										onBlur={ ( event ) => {
											onSlugChange(
												cleanForSlug(
													event.target.value ||
														savedSlug
												)
											);
											if ( forceEmptyField ) {
												setForceEmptyField( false );
											}
										} }
									/>
								) }
								<VStack spacing={ 1 }>
									<Text
										size="11"
										lineHeight={ 1.4 }
										weight={ 500 }
										upperCase={ true }
									>
										{ viewPostLabel || __( 'View post' ) }
									</Text>
									<ExternalLink
										className="editor-post-url__link"
										href={ record.link }
										target="_blank"
									>
										{ permaLink }
									</ExternalLink>
								</VStack>
							</VStack>
						</>
					);
				} }
			/>
		</HStack>
	);
}
