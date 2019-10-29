/**
 * External dependencies
 */
import classnames from 'classnames';

function ActionBarItem( props ) {
	const { align, className, ...restProps } = props;
	const classNames = classnames(
		className,
		align && `is-align-${ align }`,
		'components-action-bar__item'
	);

	return <div className={ classNames } { ...restProps } />;
}

ActionBarItem.defaultProps = {
	align: 'left',
};

export default ActionBarItem;
