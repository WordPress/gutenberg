/**
 * External dependencies
 */
import { get, some } from 'lodash';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Calculates the image sizes that are avaible for the current gallery images in order to
 * populate the 'Image size' selector.
 *
 * @param {Array}    images      Basic image block data taken from current gallery innerBlock
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
					const defaultUrl = get( img, [
						'sizes',
						size.slug,
						'url',
					] );
					const mediaDetailsUrl = get( img, [
						'media_details',
						'sizes',
						size.slug,
						'source_url',
					] );
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
		return imageSizes
			.filter( ( { slug } ) =>
				some( resizedImages, ( sizes ) => sizes[ slug ] )
			)
			.map( ( { name, slug } ) => ( { value: slug, label: name } ) );
	}
}
