/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import FlexItem from '../flex/item';

function ActionBarItem( props ) {
	const { className, ...restProps } = props;
	const classNames = classnames( className, 'components-action-bar__item' );

	return <FlexItem className={ classNames } { ...restProps } />;
}

export default ActionBarItem;
