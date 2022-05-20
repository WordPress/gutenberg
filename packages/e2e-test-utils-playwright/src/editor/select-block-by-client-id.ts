/**
 * Internal dependencies
 */
import type { Editor } from './index';

export async function selectBlockByClientId( this: Editor, clientId: string ) {
	await this.page.evaluate( ( id: string ) => {
		// @ts-ignore
		wp.data.dispatch( 'core/block-editor' ).selectBlock( id );
	}, clientId );
}
