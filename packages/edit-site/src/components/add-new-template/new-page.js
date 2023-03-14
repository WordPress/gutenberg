/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { store as coreStore } from '@wordpress/core-data';
import { plus } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { useHistory } from '../routes';

export default function NewPage( { postType, toggleProps, showIcon = true } ) {
	const history = useHistory();
	const { createErrorNotice } = useDispatch( noticesStore );
	const { saveEntityRecord } = useDispatch( coreStore );

	async function createPage() {
		try {
			const page = await saveEntityRecord(
				'postType',
				'page',
				{
					// Slugs need to be strings, so this is for template `404`
					status: 'publish',
					title: 'untitled',
				},
				{ throwOnError: true }
			);

			// Navigate to the created template part editor.
			history.push( {
				postId: page.id,
				postType: 'page',
			} );

			// TODO: Add a success notice?
		} catch ( error ) {
			const errorMessage =
				error.message && error.code !== 'unknown_error'
					? error.message
					: __( 'An error occurred while creating the page.' );

			createErrorNotice( errorMessage, { type: 'snackbar' } );
		}
	}

	const { as: Toggle = Button, ...restToggleProps } = toggleProps ?? {};

	return (
		<Toggle
			{ ...restToggleProps }
			onClick={ createPage }
			icon={ showIcon ? plus : null }
			label={ postType.labels.add_new }
		>
			{ showIcon ? null : postType.labels.add_new }
		</Toggle>
	);
}
