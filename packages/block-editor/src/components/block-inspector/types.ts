import type { ReactNode } from 'react';
import type { ContentOnlySectionEdit } from '../../hooks/types';
import type { BlockEditingMode } from '../../store/types';
import type { InspectorTab } from '../inspector-controls-tabs/types';

/**
 * The selected style state of a block, which always has both parts.
 */
export interface SelectedStyleState {
	viewport: string;
	pseudo: string;
}

export interface StyleInspectorSlotsProps {
	showAdvancedControls?: boolean;
	showPositionControls?: boolean;
	showBindingsControls?: boolean;
}

export interface StyleStateInspectorSlotsProps {
	blockName: string;
	clientId: string;
	contentClientIds: string[];
	isSectionBlock?: boolean;
	selectedBlockStyleState: SelectedStyleState;
}

export interface BlockInspectorSingleBlockWrapperProps {
	animate: unknown;
	wrapper: ( children: ReactNode ) => ReactNode;
	children: ReactNode;
}

export interface AnimatedContainerProps {
	blockInspectorAnimationSettings:
		{ enterDirection?: string } | null | undefined;
	renderedBlockClientId: string;
	children: ReactNode;
}

export interface BlockInspectorSingleBlockProps {
	/**
	 * The block that is displayed in the inspector. This is the block whose
	 * controls and information are shown to the user.
	 */
	renderedBlockClientId: string;
	blockName: string;
	isSectionBlock?: boolean;
	availableTabs: InspectorTab[];
	contentClientIds: string[];
	hasBlockStyles?: boolean;
	editedContentOnlySection?: string;
	blockEditingMode?: BlockEditingMode;
	selectedBlockStyleState: SelectedStyleState;
	showStateOnCanvas?: boolean;
	isResponsiveEditing?: boolean;
	blockStatesEditingEnabled?: boolean;
}

export type InlineEditButtonProps = Pick<
	ContentOnlySectionEdit,
	| 'editedContentOnlySection'
	| 'editContentOnlySection'
	| 'stopEditingContentOnlySection'
> & {
	clientId: string;
};
