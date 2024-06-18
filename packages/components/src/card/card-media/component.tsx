/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../../context';
import { contextConnect } from '../../context';
import { View } from '../../view';
import { useCardMedia } from './hook';
import type { MediaProps } from '../types';

function UnconnectedCardMedia(
	props: WordPressComponentProps< MediaProps, 'div' >,
	forwardedRef: ForwardedRef< any >
) {
	const cardMediaProps = useCardMedia( props );

	return <View { ...cardMediaProps } ref={ forwardedRef } />;
}

/**
 * `CardMedia` provides a container for full-bleed content within a `Card`,
 * such as images, video, or even just a background color.
 *
 * @example
 * ```jsx
 * import { Card, CardBody, CardMedia } from '@wordpress/components';
 *
 * const Example = () => (
 *  <Card>
 *	  <CardMedia>
 *		  <img src="..." />
 *    </CardMedia>
 *    <CardBody>...</CardBody>
 *  </Card>
 * );
 * ```
 */
export const CardMedia = contextConnect( UnconnectedCardMedia, 'CardMedia' );

export default CardMedia;
