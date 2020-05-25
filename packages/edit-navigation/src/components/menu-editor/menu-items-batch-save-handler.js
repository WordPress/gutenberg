/**
 * External dependencies
 */
import { keyBy, omit } from 'lodash';
/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

export default function batchSave( menuId, menuItemsRef, nestedBlocks ) {
	const handler = new MenuItemsBatchSaveHandler(
		menuId,
		menuItemsRef,
		nestedBlocks
	);
	return handler.batchSave();
}

class MenuItemsBatchSaveHandler {
	constructor( menuId, menuItemsRef, nestedBlocks ) {
		this.menuId = menuId;
		this.menuItemsRef = menuItemsRef;
		this.nestedBlocks = nestedBlocks;
	}

	async batchSave() {
		return await apiFetch( {
			url: '/wp-admin/admin-ajax.php',
			method: 'POST',
			body: await this.prepareRequestBody(),
		} );
	}

	async prepareRequestBody() {
		const body = new FormData();
		body.append( 'wp_customize', 'on' );
		body.append( 'customize_theme', 'twentytwenty' );
		body.append( 'nonce', await getNonceB() );
		body.append( 'customize_changeset_uuid', uuidv4() );
		body.append( 'customize_autosaved', 'on' );
		body.append(
			'customized',
			JSON.stringify( this.prepareCustomizedValue() )
		);
		body.append( 'customize_changeset_status', 'publish' );
		body.append( 'action', 'customize_save' );
		return body;
	}

	prepareCustomizedValue() {
		keyBy(
			this.prepareRequestMenuItemsList(),
			( item ) => `nav_menu_item[${ item.id }]`
		);
	}

	prepareRequestMenuItemsList(
		nestedBlocks = this.nestedBlocks,
		parentId = 0
	) {
		nestedBlocks.flatMap( ( block, index ) =>
			[
				this.prepareRequestMenuItem( block, parentId, index + 1 ),
			].concat(
				this.prepareRequestMenuItemsList(
					block.innerBlocks,
					this.getMenuItemForBlock( block )?.id
				)
			)
		);
	}

	prepareRequestMenuItem( block, parentId, position ) {
		const menuItem = omit(
			this.getMenuItemForBlock( block ),
			'menus',
			'meta'
		);
		return {
			...menuItem,
			position,
			title: block.attributes?.label,
			url: block.attributes.url,
			original_title: '',
			classes: ( menuItem.classes || [] ).join( ' ' ),
			xfn: ( menuItem.xfn || [] ).join( ' ' ),
			nav_menu_term_id: this.menuId,
			menu_item_parent: parentId,
			status: 'publish',
			_invalid: false,
		};
	}

	getMenuItemForBlock( block ) {
		return omit(
			this.menuItemsRef.current[ block.clientId ] || {},
			'_links'
		);
	}
}

async function getNonceB() {
	let body = await fetch( '/wp-admin/customize.php' ).then( ( response ) =>
		response.text()
	);
	body = body.substr( body.indexOf( '_wpCustomizeSettings =' ) );
	body = body.substr(
		0,
		body.indexOf( '_wpCustomizeSettings.initialClientTimestamp' )
	);
	let _wpCustomizeSettings;
	eval( body );
	return _wpCustomizeSettings.nonce.save;
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
