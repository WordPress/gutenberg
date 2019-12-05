/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ToolbarItem from '../toolbar-item';
import IconButton from '../icon-button';

function ToolbarIconButton( props, ref ) {
	const className = classnames(
		'components-toolbar-icon-button',
		props.className
	);
	return (
		<ToolbarItem { ...props } className={ className } ref={ ref }>
			{ ( toolbarItemProps ) => <IconButton { ...toolbarItemProps } /> }
		</ToolbarItem>
	);
}

export default forwardRef( ToolbarIconButton );
