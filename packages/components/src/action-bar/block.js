/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import { useActionBarContext } from './context';
import FlexBlock from '../flex/block';

export const defaultProps = {
	innerPadding: 'medium',
};

function ActionBarBlock( props ) {
	const { className, ...restProps } = props;
	const mergedProps = { ...defaultProps, ...useActionBarContext(), ...props };
	const { innerPadding } = mergedProps;

	const classes = classnames(
		'components-action-bar__block',
		innerPadding && `is-innerPadding-${ innerPadding }`,
		className
	);

	return <FlexBlock className={ classes } { ...restProps } />;
}

export default ActionBarBlock;
