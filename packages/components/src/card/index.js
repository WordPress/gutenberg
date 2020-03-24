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
	isBorderless: false,
	isElevated: false,
	padding: 'medium',
};

export function Card( props ) {
	const {
		className,
		isBorderless,
		isElevated,
		padding,
		...additionalProps
	} = props;
	const { Provider } = CardContext;

	const contextProps = {
		isBorderless,
		isElevated,
		padding,
	};

	const classes = classnames(
		'components-card',
		isBorderless && 'is-borderless',
		isElevated && 'is-elevated',
		padding && `is-padding-${ padding }`,
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
