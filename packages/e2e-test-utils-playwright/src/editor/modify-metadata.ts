/**
 * Internal dependencies
 */
import type { Editor } from './index';

/**
 * Clicks on the button in the header which opens Document Settings sidebar when
 * it is closed.
 *
 * @param this
 * @param postType
 * @param postId
 * @param metaKey
 * @param metaValue
 */
export async function modifyMetadata(
	this: Editor,
	postType: string,
	postId: string,
	metaKey: string,
	metaValue: string
) {
	await this.page.waitForFunction( () => window?.wp?.data );

	const data = {
		postType,
		postId,
		metaKey,
		metaValue,
	};

	await this.page.evaluate( ( _data ) => {
		window.wp.data
			.dispatch( 'core' )
			.editEntityRecord( 'postType', _data.postType, _data.postId, {
				meta: { [ _data.metaKey ]: _data.metaValue },
			} );
	}, data );
}
