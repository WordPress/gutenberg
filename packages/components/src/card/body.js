/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import { BodyUI } from './styles/card-styles';
import { useCardContext } from './context';

export const defaultProps = {
	isShady: false,
	padding: 'medium',
};

export function CardBody( props ) {
	const { className, isShady, ...additionalProps } = props;
	const mergedProps = { ...defaultProps, ...useCardContext(), ...props };
	const { padding } = mergedProps;

	const classes = classnames(
		'components-card__body',
		isShady && 'is-shady',
		padding && `is-padding-${ padding }`,
		className
	);

	return <BodyUI { ...additionalProps } className={ classes } />;
}

export default CardBody;
