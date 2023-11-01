/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { safeDecodeURIComponent, filterURLForDisplay } from '@wordpress/url';
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
import { useEntityRecord, store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import useEditedEntityRecord from '../../use-edited-entity-record';

export const PERMALINK_POSTNAME_REGEX = /%(?:postname|pagename)%/;

export default function PageSlug( { postType, postId } ) {
	const { createErrorNotice } = useDispatch( noticesStore );
	const { editEntityRecord } = useDispatch( coreStore );
	const { record, isLoaded } = useEditedEntityRecord( postType, postId );
	const { record: savedRecord } = useEntityRecord( postType, postId );
	const [ popoverAnchor, setPopoverAnchor ] = useState( null );
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
	if ( ! isLoaded ) {
		return null;
	}
	const onSlugChange = async ( newValue ) => {
		try {
			await editEntityRecord( 'postType', postType, postId, {
				slug: newValue,
			} );
		} catch ( error ) {
			const errorMessage =
				error.message && error.code !== 'unknown_error'
					? error.message
					: __( 'An error occurred while updating the status' );

			createErrorNotice( errorMessage, {
				type: 'snackbar',
			} );
		}
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
						{ filterURLForDisplay(
							safeDecodeURIComponent( record.link )
						) }
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
										value={ safeDecodeURIComponent(
											record.slug
										) }
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
										onChange={ onSlugChange }
										onBlur={ ( event ) => {
											if ( ! event.target.value ) {
												onSlugChange(
													savedRecord?.slug
												);
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
										{ record.link }
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
