/**
 * Components
 */
export { WidgetRender } from './components/widget-render';

/**
 * Hooks
 */
export { useWidgetTypes } from './hooks';

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
export { WidgetHostProvider, useWidgetHost } from './widget-host';
export type { WidgetHost, WidgetHostLinks } from './widget-host';

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
	WidgetActionRecord,
	WidgetAttributeField,
	WidgetRenderProps,
	ResolveWidgetModule,
	WidgetModuleRecord,
} from './types';

export type { FieldTypeDefinition } from './field-types';
