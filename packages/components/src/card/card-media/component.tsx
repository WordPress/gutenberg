/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * Internal dependencies
 */
import { contextConnect, WordPressComponentProps } from '../../ui/context';
import { View } from '../../view';
import { useCardMedia } from './hook';
import type { MediaProps } from '../types';

export type CardMediaProps = WordPressComponentProps< MediaProps, 'div' >;

function CardMedia(
	props: CardMediaProps,
	forwardedRef: ForwardedRef< HTMLDivElement >
) {
	const cardMediaProps = useCardMedia( props );

	return <View { ...cardMediaProps } ref={ forwardedRef } />;
}

/**
 * `CardMedia` provides a container for media elements within a `Card`.
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
const ConnectedCardMedia = contextConnect< CardMediaProps >(
	CardMedia,
	'CardMedia'
);

export default ConnectedCardMedia;
