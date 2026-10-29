/**
 * Brings server-rendered `@wordpress/ui` components to life in the browser.
 *
 * Components opt in with `"interactive": true` in their `component.json`, and
 * PHP wraps them in `<wp-ui-interactive>`, with the props React needs. This
 * script mounts the real React component over what PHP printed, which stays on
 * screen until React first renders. The markup doesn't have to match React's,
 * so it can be the component's own markup, or a native field.
 *
 * The value is read from the printed field when mounting, so a change made
 * before this script loaded is kept.
 */
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';

/**
 * Mounts every `<wp-ui-interactive>` on the page.
 *
 * @param {Object} components Components, by the name PHP uses for them.
 */
export function startAll( components ) {
	let count = 0;
	for ( const island of document.querySelectorAll(
		'wp-ui-interactive:not([data-started])'
	) ) {
		island.dataset.started = '';
		const { component, props } = JSON.parse( island.dataset.interactive );
		const Component = components[ component ];
		if ( ! Component ) {
			continue;
		}

		// Each island is its own React root, so its generated IDs need their
		// own prefix to stay unique on the page.
		createRoot( island, {
			identifierPrefix: `wpui${ ++count }-`,
		} ).render( createElement( Component, getProps( island, props ) ) );
	}
}

/**
 * Starts from the value in the printed field, which may have changed since PHP
 * printed it.
 *
 * @param {HTMLElement} island The component's wrapper.
 * @param {Object}      props  Props PHP printed.
 * @return {Object} Props to render with.
 */
function getProps( island, props ) {
	const select = island.querySelector( 'select' );
	if ( select ) {
		// A searchable select takes its selected item, not its value.
		const { value, ...rest } = props;
		return {
			...rest,
			defaultValue:
				( rest.items ?? [] ).find(
					( item ) => item.value === select.value
				) ?? null,
		};
	}

	const checkbox = island.querySelector( 'input[type="checkbox"]' );
	if ( checkbox ) {
		return { ...props, defaultChecked: checkbox.checked };
	}

	return props;
}
