import type { RefCallback } from 'react';
import type { RichTextData } from '@wordpress/rich-text';

type DescriptionListItemAttributes = {
	content: string | RichTextData;
	placeholder?: string;
};

type DescriptionListItemBlockName =
	| 'core/description-term'
	| 'core/description-detail';

type KeyboardTransformOptions = {
	attributes: DescriptionListItemAttributes;
	blockName: DescriptionListItemBlockName;
	clientId: string;
};

export default function useKeyboardTransform(
	options: KeyboardTransformOptions
): RefCallback< HTMLElement | null >;
