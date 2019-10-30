/**
 * External dependencies
 */
import classnames from 'classnames';

function FlexItem( props ) {
	const { className, ...restProps } = props;
	const classes = classnames( 'components-flex__item', className );

	return <div { ...restProps } className={ classes } />;
}

export default FlexItem;
