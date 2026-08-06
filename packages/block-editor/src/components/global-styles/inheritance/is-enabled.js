/**
 * Whether the inspector surfaces inherited Global Styles values.
 *
 * Behind the `gutenberg-global-styles-inheritance-ui` Gutenberg experiment, so
 * the treatment is off unless someone opts in on the Experiments screen. With
 * it off, the panels show locally-set values alone.
 *
 * Evaluated per call rather than once at module scope, so tests can toggle the
 * experiment and so a later move to a store-backed setting only has to change
 * this one place. Always returns a boolean: callers pass the result down as a
 * prop, and `undefined` would trigger a receiving component's own default
 * parameter.
 *
 * Lives in its own module rather than in `./index` because `./panel-menu` needs
 * it too, and `./index` imports `./panel-menu`.
 *
 * @return {boolean} Whether the inherited-value treatment is enabled.
 */
export const isGlobalStylesInheritanceEnabled = () =>
	!! window.__experimentalGlobalStylesInheritanceUI;
