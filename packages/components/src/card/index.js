/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import { CardContext } from './context';
import { CardUI } from './styles/card-styles';

export const defaultProps = {
	size: 'medium',
	variant: 'default',
};

export function Card( props ) {
	const { className, size, variant, ...additionalProps } = props;
	const { Provider } = CardContext;

	const contextProps = {
		size,
		variant,
	};

	const classes = classnames(
		'components-card',
		size && `is-size-${ size }`,
		variant && `is-variant-${ variant }`,
		className
	);

	return (
		<Provider value={ contextProps }>
			<CardUI { ...additionalProps } className={ classes } />
		</Provider>
	);
}

Card.defaultProps = defaultProps;

export default Card;
