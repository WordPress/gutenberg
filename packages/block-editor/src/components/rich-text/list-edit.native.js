/**
 * WordPress dependencies
 */

import { Toolbar } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	__unstableChangeListType as changeListType,
	__unstableIsListRootSelected as isListRootSelected,
	__unstableIsActiveListType as isActiveListType,
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
					isActive: isActiveListType( value, 'ul', tagName ),
					onClick() {
						onChange( changeListType( value, { type: 'ul' } ) );

						if ( isListRootSelected( value ) ) {
							onTagNameChange( 'ul' );
						}
					},
				},
				onTagNameChange && {
					icon: 'editor-ol',
					title: __( 'Convert to ordered list' ),
					isActive: isActiveListType( value, 'ol', tagName ),
					onClick() {
						onChange( changeListType( value, { type: 'ol' } ) );

						if ( isListRootSelected( value ) ) {
							onTagNameChange( 'ol' );
						}
					},
				},
			].filter( Boolean ) }
		/>
	</BlockFormatControls>
);
