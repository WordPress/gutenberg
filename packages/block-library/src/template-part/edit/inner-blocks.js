/**
 * WordPress dependencies
 */
import { useEntityBlockEditor, store as coreStore } from '@wordpress/core-data';
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

function useRenderAppender( hasInnerBlocks ) {
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
}

function useLayout( layout ) {
	const themeSupportsLayout = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return getSettings()?.supportsLayout;
	}, [] );
	const [ defaultLayout ] = useSettings( 'layout' );
	if ( themeSupportsLayout ) {
		return layout?.inherit ? defaultLayout || {} : layout;
	}
}

function NonEditableTemplatePartPreview( {
	postId: id,
	layout,
	tagName: TagName,
	blockProps,
} ) {
	useBlockEditingMode( 'disabled' );

	const { content, editedBlocks } = useSelect(
		( select ) => {
			if ( ! id ) {
				return {};
			}
			const { getEditedEntityRecord } = select( coreStore );
			const editedRecord = getEditedEntityRecord(
				'postType',
				'wp_template_part',
				id,
				{ context: 'view' }
			);
			return {
				editedBlocks: editedRecord.blocks,
				content: editedRecord.content,
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
} ) {
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

	return <TagName { ...innerBlocksProps } />;
}

export default function TemplatePartInnerBlocks( {
	postId: id,
	hasInnerBlocks,
	layout,
	tagName: TagName,
	blockProps,
} ) {
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
