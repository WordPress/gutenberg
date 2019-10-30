/**
 * External dependencies
 */
import classnames from 'classnames';

function FlexItem( props ) {
	const { className, ...restProps } = props;
	const classNames = classnames( className, 'components-flex__item' );

	return <div className={ classNames } { ...restProps } />;
}

export default FlexItem;
