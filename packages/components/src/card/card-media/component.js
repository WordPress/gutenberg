/**
 * Internal dependencies
 */
import { contextConnect } from '../../ui/context';
import { View } from '../../view';
import { useCardMedia } from './hook';

/**
 * @param {import('../../ui/context').PolymorphicComponentProps<import('../types').MediaProps, 'div'>} props
 * @param {import('react').Ref<any>} forwardedRef
 */
function CardMedia( props, forwardedRef ) {
	const mediaProps = useCardMedia( props );

	// Should it add the `components-card__media` className ?
	return <View { ...mediaProps } ref={ forwardedRef } />;
}

/**
 * `<CardMedia />` can be placed in any order as a direct child of a `<Card />`.
 * The styles will automatically round the corners of the inner media element.
 *
 * @example
 * ```jsx
 * import { Card, CardMedia } from `@wordpress/components`;
 *
 * <Card>
 *  <CardMedia>
 *    <img src="..." />
 *  </CardMedia
 * </Card>
 * ```
 */
const ConnectedCardMedia = contextConnect( CardMedia, 'CardMedia' );

export default ConnectedCardMedia;
