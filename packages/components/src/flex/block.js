/**
 * External dependencies
 */
import classnames from 'classnames';

function FlexBlock( props ) {
	const { className, ...restProps } = props;
	const classes = classnames( 'components-flex__block', className );

	return <div { ...restProps } className={ classes } />;
}

export default FlexBlock;
