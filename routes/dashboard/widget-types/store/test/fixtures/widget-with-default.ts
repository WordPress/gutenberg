/**
 * Fixture used by resolver tests to exercise the dynamic-import branch of
 * `getWidgetTypes`. The resolver does
 * `await import( entry.widget_module )` and reads `module.default` as a
 * `Partial< WidgetType >`. This file provides a minimal valid default
 * export.
 */
export default {
	apiVersion: 1,
	title: 'Sample Widget',
};
