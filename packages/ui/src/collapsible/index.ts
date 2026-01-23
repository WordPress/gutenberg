import { Content } from './content';
import { Root } from './root';
import { Trigger } from './trigger';
export type { RootProps, TriggerProps, ContentProps } from './types';

export const Collapsible = Object.assign( Root, {
	Trigger,
	Content,
} ) as typeof Root & {
	Trigger: typeof Trigger;
	Content: typeof Content;
};
