/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import { CardProvider } from './context';
import { CardUI } from './styles/card-styles';

export const defaultProps = {
	size: 'medium',
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

Card.defaultProps = defaultProps;

export default Card;
