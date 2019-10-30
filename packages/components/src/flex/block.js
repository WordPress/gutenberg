/**
 * External dependencies
 */
import classnames from 'classnames';

function FlexBlock( props ) {
	const { className, ...restProps } = props;
	const classNames = classnames( className, 'components-flex__block' );

	return <div className={ classNames } { ...restProps } />;
}

export default FlexBlock;
