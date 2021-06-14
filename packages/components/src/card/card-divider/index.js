/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import { DividerUI } from '../styles';

/* eslint-disable jsdoc/valid-types */
/**
 * @param { JSX.IntrinsicElements['hr'] } props
 */
export function CardDivider( props ) {
	/* eslint-enable jsdoc/valid-types */
	const { className, ...additionalProps } = props;

	const classes = classnames( 'components-card__divider', className );

	return (
		<DividerUI
			{ ...additionalProps }
			children={ null }
			className={ classes }
			role="separator"
		/>
	);
}

export default CardDivider;
