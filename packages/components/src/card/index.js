/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import { CardProvider } from './context';
import Body from './body';
import Divider from './divider';
import Footer from './footer';
import Header from './header';
import Media from './media';
import { CardUI } from './styles/card.styles';

export const defaultProps = {
	size: 'md',
	variant: 'default',
};

export function Card( props ) {
	const { className, size, variant, ...additionalProps } = props;

	const classes = classnames(
		'components-card',
		size && `is-size-${ size }`,
		variant && `is-variant-${ variant }`,
		className
	);

	const contextProps = {
		size,
		variant,
	};

	return (
		<CardProvider { ...contextProps }>
			<CardUI { ...additionalProps } className={ classes } />
		</CardProvider>
	);
}

Card.Body = Body;
Card.Divider = Divider;
Card.Footer = Footer;
Card.Header = Header;
Card.Media = Media;

Card.defaultProps = defaultProps;

export default Card;
