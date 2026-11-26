import type { ElementType } from 'react';
import { useEntityBlockEditor, store as coreStore } from '@wordpress/core-data';
import type { WpTemplatePart } from '@wordpress/core-data';
import {
	InnerBlocks,
	useInnerBlocksProps,
	useSettings,
	store as blockEditorStore,
	useBlockEditingMode,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { parse } from '@wordpress/blocks';
import type { Block } from '@wordpress/blocks';

type EditorLayout = NonNullable<
	Parameters< typeof useInnerBlocksProps >[ 1 ]
>[ 'layout' ];

interface LayoutConfig extends Record< string, unknown > {
	inherit?: boolean;
}

interface InnerBlocksProps {
	postId: string;
	hasInnerBlocks?: boolean;
	layout?: LayoutConfig;
	tagName: ElementType;
	blockProps: Record< string, unknown >;
}

function useRenderAppender( hasInnerBlocks?: boolean ) {
	const blockEditingMode = useBlockEditingMode();
	// Disable appending when the editing mode is 'contentOnly'. This is so that the user can't
	// append into a template part when editing a page in the site editor. See
	// DisableNonPageContentBlocks. Ideally instead of (mis)using editing mode there would be a
	// block editor API for achieving this.
	if ( blockEditingMode === 'contentOnly' ) {
		return false;
	}
	if ( ! hasInnerBlocks ) {
		return InnerBlocks.ButtonBlockAppender;
	}
	return undefined;
}

function useLayout( layout?: LayoutConfig ): EditorLayout {
	const themeSupportsLayout = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return getSettings()?.supportsLayout;
	}, [] );
	const [ defaultLayout ] = useSettings( 'layout' );
	if ( themeSupportsLayout ) {
		return (
			layout?.inherit ? defaultLayout || {} : layout
		) as EditorLayout;
	}
	return undefined;
}

function NonEditableTemplatePartPreview( {
	postId: id,
	layout,
	tagName: TagName,
	blockProps,
}: InnerBlocksProps ) {
	useBlockEditingMode( 'disabled' );

	const { content, editedBlocks } = useSelect(
		( select ) => {
			if ( ! id ) {
				return {};
			}
			const { getEditedEntityRecord } = select( coreStore );
			const editedRecord = (
				getEditedEntityRecord as ( ...args: unknown[] ) => unknown
			 )( 'postType', 'wp_template_part', id, {
				context: 'view',
			} ) as ( WpTemplatePart & { blocks?: Block[] } ) | undefined;
			return {
				editedBlocks: editedRecord!.blocks,
				content: editedRecord!.content,
			};
		},
		[ id ]
	);

	const blocks = useMemo( () => {
		if ( ! id ) {
			return undefined;
		}

		if ( editedBlocks ) {
			return editedBlocks;
		}

		if ( ! content || typeof content !== 'string' ) {
			return [];
		}

		return parse( content );
	}, [ id, editedBlocks, content ] );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		value: blocks,
		onInput: () => {},
		onChange: () => {},
		renderAppender: false,
		layout: useLayout( layout ),
	} );

	return <TagName { ...innerBlocksProps } />;
}

function EditableTemplatePartInnerBlocks( {
	postId: id,
	hasInnerBlocks,
	layout,
	tagName: TagName,
	blockProps,
}: InnerBlocksProps ) {
	const onNavigateToEntityRecord = useSelect(
		( select ) =>
			select( blockEditorStore ).getSettings().onNavigateToEntityRecord,
		[]
	);

	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		'wp_template_part',
		{ id }
	);

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		value: blocks,
		onInput,
		onChange,
		renderAppender: useRenderAppender( hasInnerBlocks ),
		layout: useLayout( layout ),
	} );

	const blockEditingMode = useBlockEditingMode();

	const customProps =
		blockEditingMode === 'contentOnly' && onNavigateToEntityRecord
			? {
					onDoubleClick: () =>
						onNavigateToEntityRecord( {
							postId: id,
							postType: 'wp_template_part',
						} ),
				}
			: {};

	return <TagName { ...innerBlocksProps } { ...customProps } />;
}

export default function TemplatePartInnerBlocks( {
	postId: id,
	hasInnerBlocks,
	layout,
	tagName: TagName,
	blockProps,
}: InnerBlocksProps ) {
	const { canViewTemplatePart, canEditTemplatePart } = useSelect(
		( select ) => {
			return {
				canViewTemplatePart: !! select( coreStore ).canUser( 'read', {
					kind: 'postType',
					name: 'wp_template_part',
					id,
				} ),
				canEditTemplatePart: !! select( coreStore ).canUser( 'update', {
					kind: 'postType',
					name: 'wp_template_part',
					id,
				} ),
			};
		},
		[ id ]
	);

	if ( ! canViewTemplatePart ) {
		return null;
	}

	const TemplatePartInnerBlocksComponent = canEditTemplatePart
		? EditableTemplatePartInnerBlocks
		: NonEditableTemplatePartPreview;

	return (
		<TemplatePartInnerBlocksComponent
			postId={ id }
			hasInnerBlocks={ hasInnerBlocks }
			layout={ layout }
			tagName={ TagName }
			blockProps={ blockProps }
		/>
	);
}
