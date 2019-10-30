/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import { useActionBarContext } from './context';

export const defaultProps = {
	role: 'presentation',
	spacing: 'medium',
};

function ActionBarDivider( props ) {
	const { className, ...restProps } = props;
	const mergedProps = { ...defaultProps, ...useActionBarContext(), ...props };
	const { spacing } = mergedProps;

	const classes = classnames(
		'components-action-bar__divider',
		spacing && `is-spacing-${ spacing }`,
		className
	);

	return <div { ...restProps } className={ classes } />;
}

export default ActionBarDivider;
