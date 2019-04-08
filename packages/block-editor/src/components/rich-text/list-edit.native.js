/**
 * WordPress dependencies
 */

import { Toolbar } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	changeListType,
	__unstableIsListRootSelected,
	__unstableIsActiveListType,
} from '@wordpress/rich-text';

/**
 * Internal dependencies
 */

import BlockFormatControls from '../block-format-controls';

export const ListEdit = ( {
	onTagNameChange,
	tagName,
	value,
	onChange,
} ) => (
	<BlockFormatControls>
		<Toolbar
			controls={ [
				onTagNameChange && {
					icon: 'editor-ul',
					title: __( 'Convert to unordered list' ),
					isActive: __unstableIsActiveListType( 'ul', tagName, value ),
					onClick() {
						onChange( changeListType( value, { type: 'ul' } ) );

						if ( __unstableIsListRootSelected( value ) ) {
							onTagNameChange( 'ul' );
						}
					},
				},
				onTagNameChange && {
					icon: 'editor-ol',
					title: __( 'Convert to ordered list' ),
					isActive: __unstableIsActiveListType( 'ol', tagName, value ),
					onClick() {
						onChange( changeListType( value, { type: 'ol' } ) );

						if ( __unstableIsListRootSelected( value ) ) {
							onTagNameChange( 'ol' );
						}
					},
				},
			].filter( Boolean ) }
		/>
	</BlockFormatControls>
);
