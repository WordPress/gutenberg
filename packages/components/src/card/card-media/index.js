/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import { MediaUI } from '../styles';

/* eslint-disable jsdoc/valid-types */
/**
 * @param { import('../types').MediaProps & JSX.IntrinsicElements['div']} props
 */
export function CardMedia( props ) {
	/* eslint-enable jsdoc/valid-types */
	const { className, ...additionalProps } = props;

	const classes = classnames( 'components-card__media', className );

	return <MediaUI { ...additionalProps } className={ classes } />;
}

export default CardMedia;
