/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getUrl, getImageSizeAttributes } from './utils';

/**
 * Determines new linkDestination, linkTarget and sizeSlug values for an image block
 * from changed values supplied by parent block context.
 *
 * @param {Object} image                  Image.
 * @param {Object} context                Parent block context.
 * @param {Object} inheritedAttributes    Image block attribute that indicate which attributes are inherited from parent.
 * @param {Function} setAttributes        Image block setAttributes prop.
 */
export default function useParentAttributes(
	image,
	context,
	inheritedAttributes,
	setAttributes
) {
	const {
		linkTo: parentLinkDestination,
		linkTarget: parentLinkTarget,
		sizeSlug: parentSizeSlug,
	} = context;

	useEffect( () => {
		if ( ! inheritedAttributes.linkDestination ) {
			return;
		}
		if ( image ) {
			const href = getUrl( image, parentLinkDestination );
			setAttributes( {
				href,
				linkDestination: parentLinkDestination,
			} );
		}
	}, [ image, parentLinkDestination ] );

	useEffect( () => {
		if ( ! inheritedAttributes.linkTarget ) {
			return;
		}

		setAttributes( {
			linkTarget: parentLinkTarget,
		} );
	}, [ parentLinkTarget ] );

	useEffect( () => {
		if ( ! inheritedAttributes.sizeSlug ) {
			return;
		}

		const sizeAttributes = getImageSizeAttributes( image, parentSizeSlug );

		setAttributes( {
			...sizeAttributes,
		} );
	}, [ parentSizeSlug ] );
}
