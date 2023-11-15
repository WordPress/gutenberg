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
	__experimentalInputControl as InputControl,
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
	const permalink = isEditable ? prefix + slug + suffix : record.link;
	return filterURLForDisplay( safeDecodeURIComponent( permalink ) );
}

export default function PageSlug( { postType, postId } ) {
	const { editEntityRecord } = useDispatch( coreStore );
	const { record, savedSlug } = useSelect(
		( select ) => {
			const { getEntityRecord, getEditedEntityRecord } =
				select( coreStore );
			const savedRecord = getEntityRecord( 'postType', postType, postId );
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
	if ( ! record || ! isEditable ) {
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
				onClose={ () => {
					if ( forceEmptyField ) {
						onSlugChange( cleanForSlug( savedSlug ) );
						setForceEmptyField( false );
					}
				} }
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
								<form onSubmit={ onClose }>
									<InputControl
										__nextHasNoMarginBottom
										__next40pxDefaultSize
										label={ __( 'Permalink' ) }
										hideLabelFromVision
										value={
											forceEmptyField ? '' : recordSlug
										}
										autoComplete="off"
										spellCheck="false"
										help={ __(
											'The last part of the URL.'
										) }
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
								</form>
							</VStack>
						</>
					);
				} }
			/>
		</HStack>
	);
}
