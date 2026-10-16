import {
	asDangerousHTML,
	store,
	withSyncEvent,
} from '@wordpress/interactivity';

const { state } = store( 'router-html-regions', {
	state: {
		/** Number of directives initialized inside inert copies. */
		marks: 0,
		/** HTML supplied during hydration, outside every router region. */
		inserted: asDangerousHTML(
			'<div data-wp-interactive="router-html-regions" data-wp-router-region="html/r"><p>inserted</p></div>'
		),
	},
	actions: {
		/** Records an initialization that must not occur inside HTML content. */
		mark() {
			state.marks++;
		},
		/**
		 * Navigates from a fixture link without a document reload.
		 *
		 * @param {MouseEvent} event Link click.
		 * @return {Object} Iterator yielding navigation completion.
		 */
		navigate: withSyncEvent( function* ( event ) {
			event.preventDefault();
			// currentTarget is only available during synchronous event dispatch.
			const href = event.currentTarget.href;
			const { actions } =
				yield import( '@wordpress/interactivity-router' );
			yield actions.navigate( href );
		} ),
	},
} );
