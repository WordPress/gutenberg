/**
 * Components
 */
export { WidgetRender } from './components/widget-render';

/**
 * Hooks
 */
export { useWidgetActions, useWidgetTypes } from './hooks';

/**
 * Field types
 */
export { registerFieldType } from './field-types';

/**
 * Icon resolution
 */
export { registerIconResolver } from './icon-resolver';

/**
 * Host capabilities
 */
export { WidgetHostProvider, useWidgetHost, HostLink } from './widget-host';
export type {
	WidgetHost,
	WidgetHostActions,
	WidgetHostLinks,
} from './widget-host';

/**
 * Types
 */
export type {
	WidgetName,
	WidgetIcon,
	WidgetIconReference,
	WidgetRelevance,
	WidgetType,
	WidgetAction,
	WidgetActionEnvelope,
	WidgetActionRecord,
	WidgetCallbackAction,
	WidgetRuntimeAction,
	WidgetAttributeField,
	WidgetAttributeRecord,
	WidgetRenderProps,
	ResolveWidgetModule,
	WidgetModuleRecord,
} from './types';

export type { FieldTypeDefinition } from './field-types';
