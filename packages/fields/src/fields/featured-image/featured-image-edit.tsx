/**
 * WordPress dependencies
 */
import { Button, __experimentalGrid as Grid } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useCallback, useRef, useState } from '@wordpress/element';
import {
	privateApis as mediaUtilsPrivateApis,
	MediaUpload,
} from '@wordpress/media-utils';
import { lineSolid } from '@wordpress/icons';
import { store as coreStore } from '@wordpress/core-data';
import type { DataFormControlProps } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { BasePostWithEmbeddedFeaturedMedia } from '../../types';
import { unlock } from '../../lock-unlock';

const { MediaUploadModal } = unlock( mediaUtilsPrivateApis );

/**
 * Conditional Media component that uses MediaUploadModal when experiment is enabled,
 * otherwise falls back to media-utils MediaUpload.
 *
 * @param {Object}   root0        Component props.
 * @param {Function} root0.render Render prop function that receives { open } object.
 * @param {Object}   root0.props  Other props passed to the media upload component.
 * @return {JSX.Element} The component.
 */
function ConditionalMediaUpload( { render, ...props }: any ) {
	const [ isModalOpen, setIsModalOpen ] = useState( false );

	if ( ( window as any ).__experimentalDataViewsMediaModal ) {
		return (
			<>
				{ render && render( { open: () => setIsModalOpen( true ) } ) }
				<MediaUploadModal
					{ ...props }
					isOpen={ isModalOpen }
					onClose={ () => {
						setIsModalOpen( false );
						props.onClose?.();
					} }
					onSelect={ ( media: any ) => {
						setIsModalOpen( false );
						props.onSelect?.( media );
					} }
				/>
			</>
		);
	}

	// Fallback to media-utils MediaUpload when experiment is disabled
	return <MediaUpload { ...props } render={ render } />;
}

export const FeaturedImageEdit = ( {
	data,
	field,
	onChange,
}: DataFormControlProps< BasePostWithEmbeddedFeaturedMedia > ) => {
	const { id } = field;

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
				<ConditionalMediaUpload
					onSelect={ ( selectedMedia: any ) => {
						onChangeControl( selectedMedia.id );
					} }
					allowedTypes={ [ 'image' ] }
					value={ value }
					title={ __( 'Select Featured Image' ) }
					render={ ( { open }: any ) => (
						<div
							ref={ ref }
							role="button"
							tabIndex={ -1 }
							onClick={ open }
							onKeyDown={ ( event ) => {
								if (
									event.key === 'Enter' ||
									event.key === ' '
								) {
									event.preventDefault();
									open();
								}
							} }
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
											icon={ lineSolid }
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
					) }
				/>
			</div>
		</fieldset>
	);
};
