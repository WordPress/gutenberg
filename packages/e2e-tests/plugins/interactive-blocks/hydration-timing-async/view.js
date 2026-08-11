/**
 * This module dynamically imports @wordpress/interactivity on DOMContentLoaded.
 *
 * This simulates a lazy-loading scenario where the Interactivity API is not
 * statically imported. The test verifies that hydration still occurs even
 * when the library is loaded after DOMContentLoaded has already fired.
 */

const initStore = async () => {
	const { store, getContext } = await import( '@wordpress/interactivity' );

	store( 'test/hydration-timing-async', {
		state: {
			asyncModuleLoaded: 'yes',
		},
		callbacks: {
			// TODO: this could be unavailable during hydration. Fix
			// `data-wp-init` to support that case.
			init() {
				const context = getContext();
				context.hydrated = true;
			},
		},
	} );
};

document.addEventListener( 'DOMContentLoaded', () =>
	setTimeout( initStore, 1 )
);
