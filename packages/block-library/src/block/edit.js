/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	useEntityBlockEditor,
	useEntityRecord,
	store as coreStore,
} from '@wordpress/core-data';
import {
	Placeholder,
	Spinner,
	ToolbarButton,
	ToolbarGroup,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	useInnerBlocksProps,
	__experimentalRecursionProvider as RecursionProvider,
	__experimentalUseHasRecursion as useHasRecursion,
	InnerBlocks,
	useBlockProps,
	Warning,
	privateApis as blockEditorPrivateApis,
	BlockControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useRef, useMemo, useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';

const { useLayoutClasses } = unlock( blockEditorPrivateApis );
const fullAlignments = [ 'full', 'wide', 'left', 'right' ];

function isPartiallySynced( block ) {
	return (
		!! block.attributes.connections?.attributes &&
		Object.values( block.attributes.connections.attributes ).some(
			( connection ) => connection.source === 'pattern_attributes'
		)
	);
}

function setBlockEditMode( setEditMode, blocks ) {
	blocks.forEach( ( block ) => {
		const editMode = isPartiallySynced( block )
			? 'contentOnly'
			: 'disabled';
		setEditMode( block.clientId, editMode );
		setBlockEditMode( setEditMode, block.innerBlocks );
	} );
}

const useInferredLayout = ( blocks, parentLayout ) => {
	const initialInferredAlignmentRef = useRef();

	return useMemo( () => {
		// Exit early if the pattern's blocks haven't loaded yet.
		if ( ! blocks?.length ) {
			return {};
		}

		let alignment = initialInferredAlignmentRef.current;

		// Only track the initial alignment so that temporarily removed
		// alignments can be reapplied.
		if ( alignment === undefined ) {
			const isConstrained = parentLayout?.type === 'constrained';
			const hasFullAlignment = blocks.some( ( block ) =>
				fullAlignments.includes( block.attributes.align )
			);

			alignment = isConstrained && hasFullAlignment ? 'full' : null;
			initialInferredAlignmentRef.current = alignment;
		}

		const layout = alignment ? parentLayout : undefined;

		return { alignment, layout };
	}, [ blocks, parentLayout ] );
};

export default function ReusableBlockEdit( {
	name,
	attributes: { ref },
	__unstableParentLayout: parentLayout,
	context: { postId },
	clientId: patternClientId,
} ) {
	const { setBlockEditingMode } = useDispatch( blockEditorStore );
	const { editUrl, innerBlocks, userCanEdit } = useSelect(
		( select ) => {
			const { canUser } = select( coreStore );
			const { getSettings, getBlocks } = select( blockEditorStore );
			const blocks = getBlocks( patternClientId );
			const isBlockTheme = getSettings().__unstableIsBlockBasedTheme;
			const canEdit = canUser( 'update', 'blocks', ref );
			const defaultUrl = addQueryArgs( 'post.php', {
				action: 'edit',
				post: ref,
			} );
			const siteEditorUrl = addQueryArgs( 'site-editor.php', {
				postType: 'wp_block',
				postId: ref,
				categoryType: 'pattern',
				canvas: 'edit',
				refererId: postId,
			} );

			// For editing link to the site editor if the theme and user permissions support it.
			return {
				innerBlocks: blocks,
				editUrl:
					canUser( 'read', 'templates' ) && isBlockTheme
						? siteEditorUrl
						: defaultUrl,
				userCanEdit: canEdit,
			};
		},
		[ patternClientId, postId, ref ]
	);

	useEffect(
		() => setBlockEditMode( setBlockEditingMode, innerBlocks ),
		[ innerBlocks, setBlockEditingMode ]
	);

	const hasAlreadyRendered = useHasRecursion( ref );
	const { record, hasResolved } = useEntityRecord(
		'postType',
		'wp_block',
		ref
	);

	const isMissing = hasResolved && ! record;

	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		'wp_block',
		{ id: ref }
	);

	const { alignment, layout } = useInferredLayout( blocks, parentLayout );
	const layoutClasses = useLayoutClasses( { layout }, name );

	const blockProps = useBlockProps( {
		className: classnames(
			'block-library-block__reusable-block-container',
			layout && layoutClasses,
			{ [ `align${ alignment }` ]: alignment }
		),
	} );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		value: blocks,
		layout,
		onInput,
		onChange,
		renderAppender: blocks?.length
			? undefined
			: InnerBlocks.ButtonBlockAppender,
	} );

	let children = null;
	if ( hasAlreadyRendered ) {
		children = (
			<Warning>
				{ __( 'Block cannot be rendered inside itself.' ) }
			</Warning>
		);
	}

	if ( isMissing ) {
		children = (
			<Warning>
				{ __( 'Block has been deleted or is unavailable.' ) }
			</Warning>
		);
	}

	if ( ! hasResolved ) {
		children = (
			<Placeholder>
				<Spinner />
			</Placeholder>
		);
	}

	return (
		<RecursionProvider uniqueId={ ref }>
			{ userCanEdit && (
				<BlockControls>
					<ToolbarGroup>
						<ToolbarButton href={ editUrl }>
							{ __( 'Edit' ) }
						</ToolbarButton>
					</ToolbarGroup>
				</BlockControls>
			) }
			{ children === null ? (
				<div { ...innerBlocksProps } />
			) : (
				<div { ...blockProps }>{ children }</div>
			) }
		</RecursionProvider>
	);
}
