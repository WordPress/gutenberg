/**
 * External dependencies
 */
import { keyBy, omit } from 'lodash';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

export default function batchSave( menuId, menuItemsRef, navigationBlock ) {
	async function request() {
		const { nonce, stylesheet } = await apiFetch( {
			path: '/__experimental/customizer-nonces/get-save-nonce',
		} );

		const body = new FormData();
		body.append( 'wp_customize', 'on' );
		body.append( 'customize_theme', stylesheet );
		body.append( 'nonce', nonce );
		body.append( 'customize_changeset_uuid', uuidv4() );
		body.append( 'customize_autosaved', 'on' );
		body.append(
			'customized',
			JSON.stringify(
				keyBy(
					linkBlocksToRequestData( navigationBlock.innerBlocks ),
					( item ) => `nav_menu_item[${ item.id }]`
				)
			)
		);
		body.append( 'customize_changeset_status', 'publish' );
		body.append( 'action', 'customize_save' );

		return await apiFetch( {
			url: '/wp-admin/admin-ajax.php',
			method: 'POST',
			body,
		} );
	}

	function linkBlocksToRequestData( blocks, parentId = 0 ) {
		blocks.flatMap( ( block, index ) =>
			[ linkBlockToRequestData( block, parentId, index + 1 ) ].concat(
				linkBlocksToRequestData(
					block.innerBlocks,
					getMenuItemForBlock( block )?.id
				)
			)
		);
	}

	function linkBlockToRequestData( block, parentId, position ) {
		const menuItem = omit( getMenuItemForBlock( block ), 'menus', 'meta' );
		return {
			...menuItem,
			position,
			title: block.attributes?.label,
			url: block.attributes.url,
			original_title: '',
			classes: ( menuItem.classes || [] ).join( ' ' ),
			xfn: ( menuItem.xfn || [] ).join( ' ' ),
			nav_menu_term_id: menuId,
			menu_item_parent: parentId,
			status: 'publish',
			_invalid: false,
		};
	}

	function getMenuItemForBlock( block ) {
		return omit( menuItemsRef.current[ block.clientId ] || {}, '_links' );
	}

	return request();
}

function uuidv4() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace( /[xy]/g, function(
		c
	) {
		const r = ( Math.random() * 16 ) | 0,
			v = c === 'x' ? r : ( r & 0x3 ) | 0x8;
		return v.toString( 16 );
	} );
}
