/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import { CardContext } from '../context';
import { CardUI } from '../styles';

export const defaultProps = {
	isBorderless: false,
	isElevated: false,
	size: 'medium',
};

/* eslint-disable jsdoc/valid-types */
/**
 * @param { import('../types').Props & JSX.IntrinsicElements['div'] } props
 */
export function Card( props ) {
	/* eslint-enable jsdoc/valid-types */
	const {
		className,
		isBorderless,
		isElevated,
		size,
		...additionalProps
	} = props;
	const { Provider } = CardContext;

	const contextProps = {
		isBorderless,
		isElevated,
		size,
	};

	const classes = classnames(
		'components-card',
		isBorderless && 'is-borderless',
		isElevated && 'is-elevated',
		size && `is-size-${ size }`,
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
