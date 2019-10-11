/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import { HeaderUI } from './styles/card.styles';
import { useCardContext } from './context';

export const defaultProps = {
	isShady: false,
	size: 'md',
};

export function Header( props ) {
	const { className, isShady, ...additionalProps } = props;
	const mergedProps = { ...useCardContext(), ...props };
	const { size, variant } = mergedProps;

	const classes = classnames(
		'components-card-header',
		isShady && 'is-shady',
		size && `is-size-${ size }`,
		variant && `is-variant-${ variant }`,
		className
	);

	return <HeaderUI { ...additionalProps } className={ classes } />;
}

Header.defaultProps = defaultProps;

export default Header;
