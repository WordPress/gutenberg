/**
 * The JavaScript parts of the `gutenberg-test-entity-actions-api/close-comments`
 * action the test plugin registers for Pages.
 *
 * The default export maps action ids to the properties of the action that PHP
 * cannot serialize. The module applies to the actions it was registered with:
 * `gutenberg-test-entity-actions-api/close-comments`. The
 * `gutenberg-test-entity-actions-api/archive` entry is a whole action no PHP
 * registration names: the editor ignores it, as a module only augments the
 * actions registered with it.
 *
 * No build step: the callback dispatches through the data registry it
 * receives, so the module imports nothing.
 */

const closeComments = {
	isEligible: ( item ) => item.comment_status === 'open',
	callback: async ( items, { registry, onActionPerformed } ) => {
		const { saveEntityRecord } = registry.dispatch( 'core' );
		await Promise.all(
			items.map( ( item ) =>
				saveEntityRecord( 'postType', 'page', {
					id: item.id,
					comment_status: 'closed',
				} )
			)
		);
		registry
			.dispatch( 'core/notices' )
			.createSuccessNotice( 'Comments closed.', { type: 'snackbar' } );
		onActionPerformed?.( items );
	},
};

/**
 * A complete action definition, id and label included, with no registration
 * in PHP naming it. The editor merges a module into the actions the server
 * registered the module with, so this entry never becomes an action.
 */
const archive = {
	id: 'gutenberg-test-entity-actions-api/archive',
	label: 'Archive',
	callback: () => {},
};

export default {
	'gutenberg-test-entity-actions-api/close-comments': closeComments,
	'gutenberg-test-entity-actions-api/archive': archive,
};
