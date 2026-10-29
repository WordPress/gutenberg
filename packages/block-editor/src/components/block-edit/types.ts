import type { BlockEditingMode } from '../block-editing-mode';
import type {
	mayDisplayControlsKey,
	mayDisplayParentControlsKey,
	mayDisplayPatternEditingControlsKey,
	blockEditingModeKey,
	blockBindingsKey,
	isPreviewModeKey,
	isMultiSelectedKey,
	isInListViewBlockSupportTreeKey,
} from './context';

export interface BlockEditContextValue {
	name: string;
	isSelected?: boolean;
	clientId?: string;
	layout?: Record< string, unknown > | null;
	__unstableLayoutClassNames?: string;
	[ mayDisplayControlsKey ]?: boolean;
	[ mayDisplayParentControlsKey ]?: boolean;
	[ mayDisplayPatternEditingControlsKey ]?: boolean;
	[ blockEditingModeKey ]?: BlockEditingMode;
	[ blockBindingsKey ]?: Record< string, unknown > | null;
	[ isPreviewModeKey ]?: boolean;
	[ isMultiSelectedKey ]?: boolean;
	[ isInListViewBlockSupportTreeKey ]?: boolean;
}
