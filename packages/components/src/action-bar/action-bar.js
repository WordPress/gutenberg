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
	const { className, ...restProps } = props;
	const classNames = classnames( className, 'components-action-bar' );

	return <Flex className={ classNames } { ...restProps } />;
}

ActionBar.defaultProps = {
	align: 'center',
};

export default ActionBar;
