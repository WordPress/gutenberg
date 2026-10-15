/**
 * The JavaScript parts of the action the test plugin registers for Pages: a
 * callback showing a notice that names the pages.
 *
 * No build step: script modules cannot import the `@wordpress/*` scripts, so
 * the `wp.*` globals the editor already loaded are used instead.
 */
const { dispatch } = window.wp.data;

const feature = {
	isEligible: ( item ) => item.status !== 'trash',
	callback: ( items, { onActionPerformed } = {} ) => {
		const titles = items.map( ( item ) =>
			typeof item.title === 'string' ? item.title : item.title?.raw
		);
		dispatch( 'core/notices' ).createSuccessNotice(
			`Featured: ${ titles.join( ', ' ) }`,
			{ type: 'snackbar', id: 'gutenberg-test-feature' }
		);
		onActionPerformed?.( items );
	},
};

export default {
	'gutenberg-test-feature': feature,
	// No registration names this action, so it is ignored.
	'gutenberg-test-unregistered': {
		label: 'Unregistered',
		callback: () => {},
	},
};
