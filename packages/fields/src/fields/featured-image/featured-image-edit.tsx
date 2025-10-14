/**
 * WordPress dependencies
 */
import {
	Button,
	Dropdown,
	FormFileUpload,
	MenuItem,
	NavigableMenu,
	__experimentalGrid as Grid,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useCallback, useRef, useState } from '@wordpress/element';
import { privateApis as mediaUtilsPrivateApis } from '@wordpress/media-utils';
import { media as mediaIcon, upload } from '@wordpress/icons';
import { store as coreStore } from '@wordpress/core-data';
import type { DataFormControlProps } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { BasePostWithEmbeddedFeaturedMedia } from '../../types';
import { unlock } from '../../lock-unlock';

const { MediaUploadModal } = unlock( mediaUtilsPrivateApis );

export const FeaturedImageEdit = ( {
	data,
	field,
	onChange,
}: DataFormControlProps< BasePostWithEmbeddedFeaturedMedia > ) => {
	const { id } = field;
	const [ isModalOpen, setIsModalOpen ] = useState( false );

	const value = field.getValue( { item: data } );

	const media = useSelect(
		( select ) => {
			const { getEntityRecord } = select( coreStore );
			return getEntityRecord( 'postType', 'attachment', value );
		},
		[ value ]
	);

	const onChangeControl = useCallback(
		( newValue: number ) =>
			onChange( {
				[ id ]: newValue,
			} ),
		[ id, onChange ]
	);

	const url = media?.source_url;
	const title = media?.title?.rendered;
	const ref = useRef( null );

	return (
		<fieldset className="fields-controls__featured-image">
			<div className="fields-controls__featured-image-container">
				<Dropdown
					popoverProps={ {
						placement: 'bottom-start',
						offset: 10,
					} }
					renderToggle={ ( { onToggle } ) => (
						<div
							ref={ ref }
							role="button"
							tabIndex={ -1 }
							onClick={ onToggle }
							onKeyDown={ ( event ) => {
								if (
									event.key === 'Enter' ||
									event.key === ' '
								) {
									onToggle();
								}
							} }
						>
							<Grid
								rowGap={ 0 }
								columnGap={ 8 }
								templateColumns="24px 1fr"
							>
								{ url && (
									<>
										<img
											className="fields-controls__featured-image-image"
											alt=""
											width={ 24 }
											height={ 24 }
											src={ url }
										/>
										<span className="fields-controls__featured-image-title">
											{ title }
										</span>
									</>
								) }
								{ ! url && (
									<>
										<span
											className="fields-controls__featured-image-placeholder"
											style={ {
												width: '24px',
												height: '24px',
											} }
										/>
										<span className="fields-controls__featured-image-title">
											{ __( 'Choose an image…' ) }
										</span>
									</>
								) }
							</Grid>
						</div>
					) }
					renderContent={ ( { onClose } ) => (
						<NavigableMenu className="fields-controls__featured-image-menu">
							<MenuItem
								icon={ mediaIcon }
								onClick={ () => {
									setIsModalOpen( true );
									onClose();
								} }
							>
								{ __( 'Open Media Library' ) }
							</MenuItem>
							<FormFileUpload
								onChange={ ( event ) => {
									const files = event.target.files;
									if ( files && files[ 0 ] ) {
										// Handle file upload here
										onClose();
									}
								} }
								accept="image/*"
								render={ ( { openFileDialog } ) => (
									<MenuItem
										icon={ upload }
										onClick={ openFileDialog }
									>
										{ __( 'Upload' ) }
									</MenuItem>
								) }
							/>
							{ url && (
								<MenuItem
									onClick={ () => {
										onChangeControl( 0 );
										onClose();
									} }
								>
									{ __( 'Remove' ) }
								</MenuItem>
							) }
						</NavigableMenu>
					) }
				/>
				<MediaUploadModal
					isOpen={ isModalOpen }
					render={ ( { open }: { open: () => void } ) => {
						return (
							<div
								ref={ ref }
								role="button"
								tabIndex={ -1 }
								onClick={ () => {
									open();
								} }
								onKeyDown={ open }
							>
								<Grid
									rowGap={ 0 }
									columnGap={ 8 }
									templateColumns="24px 1fr 24px"
								>
									{ url && (
										<>
											<img
												className="fields-controls__featured-image-image"
												alt=""
												width={ 24 }
												height={ 24 }
												src={ url }
											/>
											<span className="fields-controls__featured-image-title">
												{ title }
											</span>
										</>
									) }
									{ ! url && (
										<>
											<span
												className="fields-controls__featured-image-placeholder"
												style={ {
													width: '24px',
													height: '24px',
												} }
											/>
											<span className="fields-controls__featured-image-title">
												{ __( 'Choose an image…' ) }
											</span>
										</>
									) }
									{ url && (
										<>
											<Button
												size="small"
												className="fields-controls__featured-image-remove-button"
												onClick={ (
													event: React.MouseEvent< HTMLButtonElement >
												) => {
													event.stopPropagation();
													onChangeControl( 0 );
												} }
											/>
										</>
									) }
								</Grid>
							</div>
						);
					} }
					onSelect={ ( selectedMedia: any ) => {
						onChangeControl( selectedMedia.id );
						setIsModalOpen( false );
					} }
					allowedTypes={ [ 'image' ] }
					value={ value }
					title={ __( 'Select Featured Image' ) }
				/>
			</div>
		</fieldset>
	);
};
