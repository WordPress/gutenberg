/**
 * WordPress dependencies
 */

import { Toolbar } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export const ListToolbar = ( { editor, onTagChange, tagName } ) => (
	<Toolbar
		controls={ [
			{
				icon: 'editor-ul',
				title: __( 'Convert to unordered list' ),
				isActive: tagName === 'ul',
				onClick: () => {
					if (
						! editor.selection ||
						editor.selection.getNode().closest( 'ol' ) === editor.getBody() ) {
						onTagChange( 'ul' );
					} else {
						editor.execCommand( 'InsertUnorderedList' );
					}
				},
			},
			{
				icon: 'editor-ol',
				title: __( 'Convert to ordered list' ),
				isActive: tagName === 'ol',
				onClick: () => {
					if (
						! editor.selection ||
						editor.selection.getNode().closest( 'ul' ) === editor.getBody()
					) {
						onTagChange( 'ol' );
					} else {
						editor.execCommand( 'InsertOrderedList' );
					}
				},
			},
			{
				icon: 'editor-outdent',
				title: __( 'Outdent list item' ),
				onClick: () => editor.execCommand( 'Outdent' ),
			},
			{
				icon: 'editor-indent',
				title: __( 'Indent list item' ),
				onClick: () => editor.execCommand( 'Indent' ),
			},
		] }
	/>
);
