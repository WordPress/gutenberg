/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	MediaUpload,
	MediaUploadCheck,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { store as noticesStore } from '@wordpress/notices';
import {
	Button,
	BaseControl,
	DropZone,
	Spinner,
	__experimentalHStack as HStack,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { isBlobURL } from '@wordpress/blob';
import { __, sprintf } from '@wordpress/i18n';
import { useRef, useState } from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';
import { useSelect, useDispatch } from '@wordpress/data';

const POSTER_IMAGE_ALLOWED_MEDIA_TYPES = [ 'image' ];

function PosterImage( { poster, onChange } ) {
	const posterButtonRef = useRef();
	const [ isLoading, setIsLoading ] = useState( false );
	const descriptionId = useInstanceId(
		PosterImage,
		'block-library-poster-image-description'
	);

	const { getSettings } = useSelect( blockEditorStore );
	const { createErrorNotice } = useDispatch( noticesStore );

	const onDropFiles = ( filesList ) => {
		getSettings().mediaUpload( {
			allowedTypes: POSTER_IMAGE_ALLOWED_MEDIA_TYPES,
			filesList,
			onFileChange: ( [ image ] ) => {
				if ( isBlobURL( image?.url ) ) {
					setIsLoading( true );
					return;
				}

				if ( image ) {
					onChange( image );
				}
				setIsLoading( false );
			},
			onError: ( message ) => {
				createErrorNotice( message, {
					id: 'poster-image-upload-notice',
					type: 'snackbar',
				} );
				setIsLoading( false );
			},
			multiple: false,
		} );
	};

	const getPosterButtonContent = () => {
		if ( ! poster && isLoading ) {
			return <Spinner />;
		}

		return ! poster ? __( 'Set poster image' ) : __( 'Replace' );
	};

	return (
		<MediaUploadCheck>
			<ToolsPanelItem
				label={ __( 'Poster image' ) }
				isShownByDefault
				hasValue={ () => !! poster }
				onDeselect={ () => onChange( undefined ) }
			>
				<BaseControl.VisualLabel>
					{ __( 'Poster image' ) }
				</BaseControl.VisualLabel>
				<MediaUpload
					title={ __( 'Select poster image' ) }
					onSelect={ onChange }
					allowedTypes={ POSTER_IMAGE_ALLOWED_MEDIA_TYPES }
					render={ ( { open } ) => (
						<div className="block-library-poster-image__container">
							{ poster && (
								<Button
									__next40pxDefaultSize
									onClick={ open }
									aria-haspopup="dialog"
									aria-label={ __(
										'Edit or replace the poster image.'
									) }
									className="block-library-poster-image__preview"
									disabled={ isLoading }
									accessibleWhenDisabled
								>
									<img
										src={ poster }
										alt={ __( 'Poster image preview' ) }
										className="block-library-poster-image__preview-image"
									/>
									{ isLoading && <Spinner /> }
								</Button>
							) }
							<HStack
								className={ clsx(
									'block-library-poster-image__actions',
									{
										'block-library-poster-image__actions-select':
											! poster,
									}
								) }
							>
								<Button
									__next40pxDefaultSize
									onClick={ open }
									ref={ posterButtonRef }
									className="block-library-poster-image__action"
									aria-describedby={ descriptionId }
									aria-haspopup="dialog"
									variant={
										! poster ? 'secondary' : undefined
									}
									disabled={ isLoading }
									accessibleWhenDisabled
								>
									{ getPosterButtonContent() }
								</Button>
								<p id={ descriptionId } hidden>
									{ poster
										? sprintf(
												/* translators: %s: poster image URL. */
												__(
													'The current poster image url is %s.'
												),
												poster
										  )
										: __(
												'There is no poster image currently selected.'
										  ) }
								</p>
								{ !! poster && (
									<Button
										__next40pxDefaultSize
										onClick={ () => {
											onChange( undefined );

											// Move focus back to the Media Upload button.
											posterButtonRef.current.focus();
										} }
										className="block-library-poster-image__action"
										disabled={ isLoading }
										accessibleWhenDisabled
									>
										{ __( 'Remove' ) }
									</Button>
								) }
							</HStack>
							<DropZone onFilesDrop={ onDropFiles } />
						</div>
					) }
				/>
			</ToolsPanelItem>
		</MediaUploadCheck>
	);
}

export default PosterImage;
