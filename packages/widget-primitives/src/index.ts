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
 * Types
 */
export type {
	WidgetName,
	WidgetIcon,
	WidgetType,
	WidgetAction,
	WidgetAttributeField,
	WidgetRenderProps,
	ResolveWidgetModule,
	WidgetModuleRecord,
} from './types';

export type { FieldTypeDefinition } from './field-types';
