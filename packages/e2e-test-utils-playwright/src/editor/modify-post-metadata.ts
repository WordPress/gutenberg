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
export async function modifyPostMetadata(
	this: Editor,
	postType: string,
	postId: string,
	metaKey: string,
	metaValue: string
) {
	await this.page.waitForFunction( () => window?.wp?.data );

	const parameters = {
		postType,
		postId,
		metaKey,
		metaValue,
	};

	await this.page.evaluate( ( _parameters ) => {
		window.wp.data
			.dispatch( 'core' )
			.editEntityRecord(
				'postType',
				_parameters.postType,
				_parameters.postId,
				{
					meta: { [ _parameters.metaKey ]: _parameters.metaValue },
				}
			);
	}, parameters );
}
