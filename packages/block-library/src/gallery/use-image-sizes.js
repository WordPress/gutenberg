/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Calculates the image sizes that are available for the current gallery images in order to
 * populate the 'Resolution' selector.
 *
 * @param {Array}    images      Basic image block data taken from current gallery innerBlock.
 * @param {boolean}  isSelected  Is the block currently selected in the editor.
 * @param {Function} getSettings Block editor store selector.
 *
 * @return {Array} An array of image size options.
 */
export default function useImageSizes( images, isSelected, getSettings ) {
	return useMemo( () => getImageSizing(), [ images, isSelected ] );

	function getImageSizing() {
		if ( ! images || images.length === 0 ) {
			return;
		}
		const { imageSizes } = getSettings();
		let resizedImages = {};

		if ( isSelected ) {
			resizedImages = images.reduce( ( currentResizedImages, img ) => {
				if ( ! img.id ) {
					return currentResizedImages;
				}

				const sizes = imageSizes.reduce( ( currentSizes, size ) => {
					const defaultUrl = img.sizes?.[ size.slug ]?.url;
					const mediaDetailsUrl =
						img.media_details?.sizes?.[ size.slug ]?.source_url;
					return {
						...currentSizes,
						[ size.slug ]: defaultUrl || mediaDetailsUrl,
					};
				}, {} );
				return {
					...currentResizedImages,
					[ parseInt( img.id, 10 ) ]: sizes,
				};
			}, {} );
		}
		const resizedImageSizes = Object.values( resizedImages );
		return imageSizes
			.filter( ( { slug } ) =>
				resizedImageSizes.some( ( sizes ) => sizes[ slug ] )
			)
			.map( ( { name, slug } ) => ( { value: slug, label: name } ) );
	}
}
