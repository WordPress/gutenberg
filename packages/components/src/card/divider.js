/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import { DividerUI } from './styles/card.styles';

export function Divider( props ) {
	const { className, ...additionalProps } = props;

	const classes = classnames( 'components-card-divider', className );

	return <DividerUI { ...additionalProps } className={ classes } role="separator" />;
}

export default Divider;
