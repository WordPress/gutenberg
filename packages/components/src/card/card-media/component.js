/**
 * Internal dependencies
 */
import { contextConnect } from '../../ui/context';
import { View } from '../../view';
import { useCardMedia } from './hook';

/**
 * @param {import('../../ui/context').WordPressComponentProps<{ children: import('react').ReactNode }, 'div'>} props
 * @param {import('react').ForwardedRef<any>}                                                                  forwardedRef
 */
function CardMedia( props, forwardedRef ) {
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
const ConnectedCardMedia = contextConnect( CardMedia, 'CardMedia' );

export default ConnectedCardMedia;
