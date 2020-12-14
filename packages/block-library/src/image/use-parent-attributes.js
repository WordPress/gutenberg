/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getUrl } from './utils';

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
		isListItem,
		linkTo: parentLinkDestination,
		linkTarget: parentLinkTarget,
		sizeSlug: parentSizeSlug,
	} = context;

	useEffect( () => {
		if ( ! isListItem ) {
			return;
		}
		if ( inheritedAttributes.linkDestination && image ) {
			const href = getUrl( image, parentLinkDestination );
			setAttributes( {
				href,
				linkDestination: parentLinkDestination,
			} );
		}
	}, [ image, parentLinkDestination, isListItem ] );

	useEffect( () => {
		if ( ! isListItem ) {
			return;
		}
		if ( inheritedAttributes.linkTarget ) {
			setAttributes( {
				linkTarget: parentLinkTarget,
			} );
		}
	}, [ parentLinkTarget, isListItem ] );

	useEffect( () => {
		if ( ! isListItem ) {
			return;
		}
		if ( inheritedAttributes.sizeSlug ) {
			const newUrl = get( image, [
				'media_details',
				'sizes',
				parentSizeSlug,
				'source_url',
			] );

			if ( ! newUrl ) {
				return;
			}

			setAttributes( {
				url: newUrl,
				width: undefined,
				height: undefined,
				sizeSlug: parentSizeSlug,
			} );
		}
	}, [ parentSizeSlug, isListItem ] );
}
