/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */

import { useBlockProps } from '@wordpress/block-editor';
import ServerSideRender from '@wordpress/server-side-render';

export default function PageListEdit( { context } ) {
	const { textColor, backgroundColor, showSubmenuIcon } = context || {};

	const blockProps = useBlockProps( {
		className: classnames( {
			'has-text-color': !! textColor,
			[ `has-${ textColor }-color` ]: !! textColor,
			'has-background': !! backgroundColor,
			[ `has-${ backgroundColor }-background-color` ]: !! backgroundColor,
			'show-submenu-icons': !! showSubmenuIcon,
		} ),
	} );

	return (
		<div { ...blockProps }>
			<ServerSideRender block="core/page-list" />
		</div>
	);
}
