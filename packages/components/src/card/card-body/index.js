/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import { BodyUI } from '../styles';
import { useCardContext } from '../context';

export const defaultProps = {
	isShady: false,
	size: 'medium',
};

/* eslint-disable jsdoc/valid-types */
/**
 * @param { import('../types').BodyProps & JSX.IntrinsicElements['div'] } props
 */
export function CardBody( props ) {
	/* eslint-enable jsdoc/valid-types */
	const { className, isShady, ...additionalProps } = props;
	const mergedProps = { ...defaultProps, ...useCardContext(), ...props };
	const { size } = mergedProps;

	const classes = classnames(
		'components-card__body',
		isShady && 'is-shady',
		size && `is-size-${ size }`,
		className
	);

	return <BodyUI { ...additionalProps } className={ classes } />;
}

export default CardBody;
