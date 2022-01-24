/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Icon } from '@wordpress/components';
import { blockDefault } from '@wordpress/icons';
import { memo } from '@wordpress/element';

function BlockIcon( { icon, showColors = false, className } ) {
	if ( icon?.src === 'block-default' ) {
		icon = {
			src: blockDefault,
		};
	}

	const renderedIcon = <Icon icon={ icon && icon.src ? icon.src : icon } />;
	const style = showColors
		? {
				backgroundColor: icon && icon.background,
				color: icon && icon.foreground,
		  }
		: {};

	return (
		<span
			style={ style }
			className={ classnames( 'block-editor-block-icon', className, {
				'has-colors': showColors,
			} ) }
		>
			{ renderedIcon }
		</span>
	);
}

export default memo( BlockIcon );
