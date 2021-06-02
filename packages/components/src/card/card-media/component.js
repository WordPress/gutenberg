/**
 * Internal dependencies
 */
import { createComponent } from '../../ui/utils';
import { useCardMedia } from './hook';

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
const CardMedia = createComponent( {
	as: 'div',
	useHook: useCardMedia,
	name: 'CardMedia',
} );

export default CardMedia;
