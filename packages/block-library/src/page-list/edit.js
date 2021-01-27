/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */

import { useBlockProps } from '@wordpress/block-editor';
import ServerSideRender from '@wordpress/server-side-render';
import { useSelect } from '@wordpress/data';

export default function PageListEdit( { clientId } ) {
	const navigationBlockAttributes = useSelect( ( select ) => {
		const { getBlockAttributes, getBlockParentsByBlockName } = select(
			'core/block-editor'
		);
		const parentBlock = getBlockParentsByBlockName(
			clientId,
			'core/navigation'
		)[ 0 ];
		return getBlockAttributes( parentBlock );
	} );
	const showSubmenuIcon = !! navigationBlockAttributes?.showSubmenuIcon;
	const { textColor, backgroundColor } = navigationBlockAttributes || {};

	const blockProps = useBlockProps( {
		className: classnames( {
			'has-text-color': !! textColor,
			[ `has-${ textColor }-color` ]: !! textColor,
			'has-background': !! backgroundColor,
			[ `has-${ backgroundColor }-background-color` ]: !! backgroundColor,
			'show-submenu-icons': showSubmenuIcon,
		} ),
	} );

	return (
		<div { ...blockProps }>
			<ServerSideRender block="core/page-list" />
		</div>
	);
}
