/**
 * External dependencies
 */
import classnames from 'classnames';

function ButtonGroup( { className, ...props } ) {
	const classes = classnames( 'components-button-group', className );

	return <div role="group" className={ classes } { ...props } />;
}

export default ButtonGroup;
