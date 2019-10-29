/**
 * External dependencies
 */
import classnames from 'classnames';

function ActionBarBlock( props ) {
	const { className, ...restProps } = props;
	const classNames = classnames( className, 'components-action-bar__block' );

	return <div className={ classNames } { ...restProps } />;
}

export default ActionBarBlock;
