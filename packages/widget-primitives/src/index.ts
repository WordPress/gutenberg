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
