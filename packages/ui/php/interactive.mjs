/**
 * Brings server-rendered `@wordpress/ui` components to life in the browser.
 *
 * Components opt in from their `component.json`, with `"interactive"` set to
 * one of two ways, and PHP wraps them in `<wp-ui-interactive>`:
 *
 * Hydrated (`hydrate`): PHP prints the markup React renders for the given
 * props, so the component looks right before this script loads. React then
 * attaches to that markup instead of replacing it, so nothing moves. The markup
 * has to match what React renders here exactly, IDs included.
 *
 * Mounted (`mount`): for components PHP can't print as React does, like a
 * searchable select, whose markup depends on its items. PHP prints a native
 * fallback instead, such as a `<select>` with the same `name`, so the form
 * works until this script loads. Then React renders the real component in its
 * place, which can make the layout move. The value is read from the fallback
 * when mounting, so a choice made before the script loaded is kept.
 */
import { createElement, useEffect } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';

/**
 * Starts every `<wp-ui-interactive>` on the page.
 *
 * @param {Object} components Components, by the name PHP uses for them.
 */
export function startAll( components ) {
	for ( const island of document.querySelectorAll(
		'wp-ui-interactive:not([data-started])'
	) ) {
		island.dataset.started = '';
		const { how, component, props, idPrefix } = JSON.parse(
			island.dataset.interactive
		);
		const Component = components[ component ];
		if ( ! Component ) {
			continue;
		}

		if ( 'hydrate' === how ) {
			hydrate( island, Component, props, idPrefix );
		} else {
			mount( island, Component, props );
		}
	}
}

/**
 * Replaces a native fallback with the React component.
 *
 * @param {HTMLElement}                   island    The component's wrapper.
 * @param {import('react').ComponentType} Component Component to render.
 * @param {Object}                        props     Props PHP printed.
 */
function mount( island, Component, props ) {
	const field = island.querySelector( 'select' );
	const value = field ? field.value : props.value;
	const { value: printedValue, class: className, ...rest } = props;
	const selected =
		( rest.items ?? [] ).find( ( item ) => item.value === value ) ?? null;

	island.replaceChildren();
	createRoot( island ).render(
		createElement( Component, {
			...rest,
			className: className || undefined,
			defaultValue: selected,
		} )
	);
}

/**
 * Renders a component, and calls `onHydrated` once React has attached to it.
 *
 * @param {Object}                        props
 * @param {import('react').ComponentType} props.Component  Component to render.
 * @param {Object}                        props.props      Its props.
 * @param {() => void}                    props.onHydrated Called after hydration.
 */
function Hydrated( { Component, props, onHydrated } ) {
	useEffect( onHydrated, [] ); // eslint-disable-line react-hooks/exhaustive-deps
	return createElement( Component, props );
}

/**
 * Attaches React to the markup PHP printed.
 *
 * @param {HTMLElement}                   island    The component's wrapper.
 * @param {import('react').ComponentType} Component Component to render.
 * @param {Object}                        props     React props PHP printed.
 * @param {string}                        idPrefix  Prefix of the printed IDs.
 */
function hydrate( island, Component, props, idPrefix ) {
	// A switch toggled before this script loaded (through its label) only
	// changes its hidden field. React keeps the field as it is, but the switch
	// starts from the printed props, so the two disagree. Once React has
	// attached, put the field back and toggle the switch, so both match.
	const field = island.querySelector( 'input[type="checkbox"]' );
	const checked = field?.checked;
	const onHydrated = () => {
		if ( field && checked !== Boolean( props.defaultChecked ) ) {
			field.checked = ! checked;
			island.querySelector( '[role="switch"]' )?.click();
		}
	};

	hydrateRoot(
		island,
		createElement( Hydrated, { Component, props, onHydrated } ),
		{ identifierPrefix: idPrefix }
	);
}
