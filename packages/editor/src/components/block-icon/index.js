/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Dashicon, SVG } from '@wordpress/components';
import { createElement, Component } from '@wordpress/element';

function renderIcon( icon ) {
	if ( 'string' === typeof icon ) {
		return <Dashicon icon={ icon } />;
	} else if ( 'function' === typeof icon ) {
		if ( icon.prototype instanceof Component ) {
			return createElement( icon );
		}

		return icon();
	} else if ( icon && icon.type === 'svg' ) {
		return <SVG { ...icon.props } />;
	}

	return icon || null;
}

export default function BlockIcon( { icon, showColors = false, className } ) {
	const renderedIcon = renderIcon( icon && icon.src ? icon.src : icon );
	const style = showColors ? {
		backgroundColor: icon && icon.background,
		color: icon && icon.foreground,
	} : {};

	if ( ! renderedIcon ) {
		return null;
	}

	return (
		<div
			style={ style }
			className={ classnames(
				'editor-block-icon',
				className,
				{ 'has-colors': showColors }
			) }
		>
			{ renderedIcon }
		</div>
	);
}
