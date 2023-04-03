import './runtime/init.js';
import { store } from './runtime';

store({
	state: {
		core: {
			isZoomed: false,
		},
	},
	actions: {
		core: {
			imageZoom: ( { context, state } ) => {
				context.core.isZoomed = !context.core.isZoomed;
				state.core.isZoomed = context.core.isZoomed;
				context.core.handleScroll = () => {
					context.core.isZoomed = false;
					state.core.isZoomed = context.core.isZoomed;
					window.removeEventListener(
						'scroll',
						context.core.handleScroll
					);
				}

				if ( context.core.isZoomed ) {
					window.addEventListener(
						'scroll',
						context.core.handleScroll
					);
				} else if ( context.core.handleScroll ) {
					window.removeEventListener(
						'scroll',
						context.core.handleScroll
					);
				}
			},
		},
	},
});
