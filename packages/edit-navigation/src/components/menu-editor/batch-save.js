/**
 * External dependencies
 */
import { keyBy, omit } from 'lodash';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

export default async function batchSave(
	menuId,
	menuItemsRef,
	navigationBlock
) {
	const { nonce, stylesheet } = await apiFetch( {
		path: '/__experimental/customizer-nonces/get-save-nonce',
	} );

	// eslint-disable-next-line no-undef
	const body = new FormData();
	body.append( 'wp_customize', 'on' );
	body.append( 'customize_theme', stylesheet );
	body.append( 'nonce', nonce );
	body.append( 'customize_changeset_uuid', uuidv4() );
	body.append( 'customize_autosaved', 'on' );
	body.append( 'customize_changeset_status', 'publish' );
	body.append( 'action', 'customize_save' );
	body.append(
		'customized',
		computeCustomizedAttribute(
			navigationBlock.innerBlocks,
			menuId,
			menuItemsRef
		)
	);

	return await apiFetch( {
		url: '/wp-admin/admin-ajax.php',
		method: 'POST',
		body,
	} );
}

function computeCustomizedAttribute( blocks, menuId, menuItemsRef ) {
	const blocksList = blocksTreeToFlatList( blocks );
	const dataList = blocksList.map( ( { block, parentId, position } ) =>
		linkBlockToRequestItem( block, parentId, position )
	);
	const dataObject = keyBy(
		dataList,
		( item ) => `nav_menu_item[${ item.id }]`
	);
	return JSON.stringify( dataObject );

	function blocksTreeToFlatList( innerBlocks, parentId = 0 ) {
		return innerBlocks.flatMap( ( block, index ) =>
			[ { block, parentId, position: index + 1 } ].concat(
				blocksTreeToFlatList(
					block.innerBlocks,
					getMenuItemForBlock( block )?.id
				)
			)
		);
	}

	function linkBlockToRequestItem( block, parentId, position ) {
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
}

function uuidv4() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace( /[xy]/g, function(
		c
	) {
		// eslint-disable-next-line no-restricted-syntax
		const a = Math.random() * 16;
		// eslint-disable-next-line no-bitwise
		const r = a | 0;
		// eslint-disable-next-line no-bitwise
		const v = c === 'x' ? r : ( r & 0x3 ) | 0x8;
		return v.toString( 16 );
	} );
}
