// @ts-nocheck
/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

function ButtonGroup( props, ref ) {
	const { className, ...restProps } = props;
	const classes = classnames( 'components-button-group', className );

	return (
		<div ref={ ref } role="group" className={ classes } { ...restProps } />
	);
}

export default forwardRef( ButtonGroup );
