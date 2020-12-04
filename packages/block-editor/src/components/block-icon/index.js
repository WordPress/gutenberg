/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { Icon } from '@wordpress/components';
import { blockDefault } from '@wordpress/icons';

export default function BlockIcon( {
	clientId,
	icon,
	showColors = false,
	className,
} ) {
	if ( icon?.src === 'block-default' ) {
		icon = {
			src: blockDefault,
		};
	}
	const { icon: blockIcon } = useSelect(
		( select ) =>
			select( 'core/blocks' ).getBlockTypeWithVariationInfo( clientId ) ||
			{},
		[ clientId ]
	);
	if ( blockIcon && ! icon ) {
		icon = blockIcon;
	}
	const renderedIcon = <Icon icon={ icon?.src || icon } />;
	const style = showColors
		? {
				backgroundColor: icon?.background,
				color: icon?.foreground,
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
