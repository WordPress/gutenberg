/**
 * Internal dependencies
 */
import { contextConnect } from '../../ui/context';
import { CardMediaView } from '../styles';
import { useCardMedia } from './hook';

/**
 *
 * @param {import('../../ui/context').PolymorphicComponentProps<{ children: import('react').ReactNode }, 'div'>} props
 * @param {import('react').Ref<any>}                                                                             forwardedRef
 */
function CardMedia( props, forwardedRef ) {
	const contextProps = useCardMedia( props );

	return <CardMediaView ref={ forwardedRef } { ...contextProps } />;
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
