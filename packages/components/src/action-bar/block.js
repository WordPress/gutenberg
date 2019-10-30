/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import FlexBlock from '../flex/block';

function ActionBarBlock( props ) {
	const { className, ...restProps } = props;
	const classNames = classnames( className, 'components-action-bar__block' );

	return <FlexBlock className={ classNames } { ...restProps } />;
}

export default ActionBarBlock;
