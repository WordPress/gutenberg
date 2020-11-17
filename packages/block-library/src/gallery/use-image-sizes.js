/**
 * External dependencies
 */
import { get, reduce, map, filter, some } from 'lodash';

export default function useImageSizes(
	images,
	isSelected,
	getSettings,
	getMedia
) {
	const { imageSizes } = getSettings();

	let resizedImages = {};

	if ( isSelected ) {
		resizedImages = reduce(
			images,
			( currentResizedImages, img ) => {
				if ( ! img.id ) {
					return currentResizedImages;
				}
				const image = img.imageData
					? img.imageData
					: getMedia( img.id );
				const sizes = reduce(
					imageSizes,
					( currentSizes, size ) => {
						const defaultUrl = get( image, [
							'sizes',
							size.slug,
							'url',
						] );
						const mediaDetailsUrl = get( image, [
							'media_details',
							'sizes',
							size.slug,
							'source_url',
						] );
						return {
							...currentSizes,
							[ size.slug ]: defaultUrl || mediaDetailsUrl,
						};
					},
					{}
				);
				return {
					...currentResizedImages,
					[ parseInt( img.id, 10 ) ]: sizes,
				};
			},
			{}
		);
	}
	return map(
		filter( imageSizes, ( { slug } ) =>
			some( resizedImages, ( sizes ) => sizes[ slug ] )
		),
		( { name, slug } ) => ( { value: slug, label: name } )
	);
}
