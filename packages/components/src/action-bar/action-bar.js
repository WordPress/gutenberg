/**
 * IDEA:
 * This is a general component that powers UI like PageHeader or Toolbar
 */

/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import Flex from '../flex';

function ActionBar( props ) {
	const { className, size, ...restProps } = props;
	const classNames = classnames(
		className,
		size && `is-size-${ size }`,
		'components-action-bar'
	);

	return <Flex className={ classNames } { ...restProps } />;
}

ActionBar.defaultProps = {
	size: 'medium',
};

export default ActionBar;
