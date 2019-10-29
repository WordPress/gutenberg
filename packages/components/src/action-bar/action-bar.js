/**
 * TODO: Move this into src/components/
 * Create a dedicated component for ActionBar
 *
 * IDEA:
 * This is a general component that powers UI like PageHeader or Toolbar
 */

/**
 * External dependencies
 */
import classnames from 'classnames';

function ActionBar( props ) {
	const { align, className, ...restProps } = props;
	const classNames = classnames(
		className,
		align && `is-align-${ align }`,
		'components-action-bar'
	);

	return <div className={ classNames } { ...restProps } />;
}

ActionBar.defaultProps = {
	align: 'center',
};

export default ActionBar;
