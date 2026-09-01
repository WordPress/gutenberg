import type {
	ComponentType,
	ForwardRefExoticComponent,
	HTMLAttributes,
	ReactNode,
	Ref,
	RefAttributes,
} from 'react';
import type { RichTextData } from '@wordpress/rich-text';

type BlockEditorBlockProps< TElement extends HTMLElement = HTMLElement > =
	HTMLAttributes< TElement > & {
		ref?: Ref< TElement >;
	};

type BlockEditorBlockPropsWithRef<
	TElement extends HTMLElement = HTMLElement,
> = HTMLAttributes< TElement > & {
	ref: Ref< TElement >;
};

type RichTextProps = Omit< HTMLAttributes< HTMLElement >, 'onChange' > & {
	identifier?: string;
	tagName?: string;
	value?: string | RichTextData;
	onChange?: ( value: string ) => void;
	onMerge?: ( clientIdA: string, clientIdB: string ) => void;
	onReplace?: (
		blocks: import('@wordpress/blocks').Block[],
		indexToSelect?: number,
		initialPosition?: number
	) => void;
	onRemove?: () => void;
	placeholder?: string;
};

type RichTextContentProps = {
	value?: string | RichTextData;
};

export const RichText: ForwardRefExoticComponent<
	RichTextProps & RefAttributes< HTMLElement >
> & {
	Content: ComponentType< RichTextContentProps >;
	isEmpty: ( value?: string ) => boolean;
};

export function useBlockProps< TElement extends HTMLElement = HTMLElement >(
	props?: BlockEditorBlockProps< TElement >
): BlockEditorBlockPropsWithRef< TElement >;

export namespace useBlockProps {
	function save< TElement extends HTMLElement = HTMLElement >(
		props?: BlockEditorBlockProps< TElement >
	): BlockEditorBlockPropsWithRef< TElement >;
}

export function useInnerBlocksProps<
	TElement extends HTMLElement,
	T extends BlockEditorBlockProps< TElement >,
>(
	props: T,
	options?: object
): T & {
	children?: ReactNode;
};

export namespace useInnerBlocksProps {
	function save<
		TElement extends HTMLElement,
		T extends BlockEditorBlockProps< TElement >,
	>( props: T ): T;
}
