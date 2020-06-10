/**
 * WordPress dependencies
 */

import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import RichImage from './rich-image';

export const isSupportedBlock = ( blockName ) =>
	[ 'core/image' ].includes( blockName );

const addRichImage = createHigherOrderComponent( ( OriginalBlock ) => {
	return ( props ) => {
		if ( ! isSupportedBlock( props.name ) ) {
			return <OriginalBlock { ...props } />;
		}

		return <RichImage { ...props } originalBlock={ OriginalBlock } />;
	};
}, 'addRichImage' );

export function registerBlock() {
	addFilter( 'editor.BlockEdit', 'core/rich-image', addRichImage );
}
