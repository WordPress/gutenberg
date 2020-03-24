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
	isBorderless: false,
	isShady: false,
	padding: 'medium',
};

export function CardFooter( props ) {
	const { className, isShady, ...additionalProps } = props;
	const mergedProps = { ...defaultProps, ...useCardContext(), ...props };
	const { isBorderless, padding } = mergedProps;

	const classes = classnames(
		'components-card__footer',
		isBorderless && 'is-borderless',
		isShady && 'is-shady',
		padding && `is-padding-${ padding }`,
		className
	);

	return <FooterUI { ...additionalProps } className={ classes } />;
}

export default CardFooter;
