/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Dashicon, Path, SVG } from '@wordpress/components';
import { createElement, Component } from '@wordpress/element';

function renderIcon( icon ) {
	if ( 'string' === typeof icon ) {
		if ( icon === 'block-default' ) {
			return <SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><Path d="M19 7h-1V5h-4v2h-4V5H6v2H5c-1.1 0-2 .9-2 2v10h18V9c0-1.1-.9-2-2-2zm0 10H5V9h14v8z" /></SVG>;
		}
		return <Dashicon icon={ icon } size={ 20 } />;
	}
	if ( 'function' === typeof icon ) {
		if ( icon.prototype instanceof Component ) {
			return createElement( icon );
		}

		return icon();
	}
	if ( icon && ( icon.type === 'svg' || icon.type === SVG ) ) {
		const appliedProps = {
			width: 24,
			height: 24,
			...icon.props,
		};
		return <SVG { ...appliedProps } />;
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
