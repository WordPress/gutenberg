/**
 * External dependencies
 */
import classnames from 'classnames';

function ActionBarItem( props ) {
	const { className, ...restProps } = props;
	const classNames = classnames( className, 'components-action-bar__item' );

	return <div className={ classNames } { ...restProps } />;
}

export default ActionBarItem;
