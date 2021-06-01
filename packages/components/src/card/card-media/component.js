/**
 * Internal dependencies
 */
import { createComponent } from '../../ui/utils';
import { useCardMedia } from './hook';

const CardMedia = createComponent( {
	as: 'div',
	useHook: useCardMedia,
	name: 'CardMedia',
} );

export default CardMedia;
