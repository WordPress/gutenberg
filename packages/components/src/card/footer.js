/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import { FooterUI } from './styles/card-styles';
import { useCardContext } from './context';

export const defaultProps = {
	isShady: false,
	size: 'medium',
};

export function CardFooter( props ) {
	const { className, isShady, ...additionalProps } = props;
	const mergedProps = { ...defaultProps, ...useCardContext(), ...props };
	const { size, variant } = mergedProps;

	const classes = classnames(
		'components-card-footer',
		isShady && 'is-shady',
		size && `is-size-${ size }`,
		variant && `is-variant-${ variant }`,
		className
	);

	return <FooterUI { ...additionalProps } className={ classes } />;
}

export default CardFooter;
