/**
 * WordPress dependencies
 */
import {
	Button,
	__experimentalGrid as Grid,
	__experimentalText as Text,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useCallback, useRef } from '@wordpress/element';
// @ts-ignore
import { MediaUpload } from '@wordpress/block-editor';
import { lineSolid } from '@wordpress/icons';
import { store as coreStore } from '@wordpress/core-data';
import type { DataFormControlProps } from '@wordpress/dataviews';
/**
 * Internal dependencies
 */
import type { BasePost } from '../../types';
import { __ } from '@wordpress/i18n';

export const FeaturedImageEdit = ( {
	data,
	field,
	onChange,
}: DataFormControlProps< BasePost > ) => {
	const { id } = field;

	const value = field.getValue( { item: data } );

	const media = useSelect(
		( select ) => {
			const { getEntityRecord } = select( coreStore );
			return getEntityRecord( 'root', 'media', value );
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
		<fieldset className="edit-site-dataviews-controls__featured-image">
			<div className="edit-side-dataviews-controls__featured-image-container">
				<MediaUpload
					onSelect={ ( selectedMedia: { id: number } ) => {
						onChangeControl( selectedMedia.id );
					} }
					allowedTypes={ [ 'image' ] }
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
									templateColumns="24px 1fr 0.5fr"
								>
									{ url && (
										<>
											<img
												className="edit-site-post-featured-image"
												alt=""
												src={ url }
											/>
											<Text
												as="span"
												truncate
												numberOfLines={ 0 }
											>
												{ title }
											</Text>
										</>
									) }
									{ ! url && (
										<>
											<span className="edit-site-post-featured-image-placeholder" />
											<span>
												{ __( 'Choose an image…' ) }
											</span>
										</>
									) }
									{ url && (
										<>
											<Button
												size="small"
												className="edit-site-dataviews-controls__featured-image-remove-button"
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
						);
					} }
				/>
			</div>
		</fieldset>
	);
};
