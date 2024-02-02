/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useRegistry, useSelect, useDispatch } from '@wordpress/data';
import { useRef, useMemo, useEffect } from '@wordpress/element';
import { useEntityRecord, store as coreStore } from '@wordpress/core-data';
import {
	Placeholder,
	Spinner,
	ToolbarButton,
	ToolbarGroup,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	useInnerBlocksProps,
	RecursionProvider,
	useHasRecursion,
	InnerBlocks,
	useBlockProps,
	Warning,
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
	BlockControls,
} from '@wordpress/block-editor';
import { privateApis as patternsPrivateApis } from '@wordpress/patterns';
import { parse, cloneBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';

const { useLayoutClasses } = unlock( blockEditorPrivateApis );
const { PARTIAL_SYNCING_SUPPORTED_BLOCKS } = unlock( patternsPrivateApis );

const fullAlignments = [ 'full', 'wide', 'left', 'right' ];

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

function hasOverrides( block ) {
	return (
		Object.keys( PARTIAL_SYNCING_SUPPORTED_BLOCKS ).includes(
			block.name
		) &&
		!! block.attributes.metadata?.bindings &&
		Object.values( block.attributes.metadata.bindings ).some(
			( binding ) => binding.source === 'core/pattern-content'
		)
	);
}
function getOverrideAttributes( block ) {
	return Object.entries( block.attributes.metadata.bindings )
		.filter(
			( [ , binding ] ) => binding.source === 'core/pattern-content'
		)
		.map( ( [ attributeKey ] ) => attributeKey );
}

function getHasOverridableBlocks( blocks ) {
	return blocks.some( ( block ) => {
		if ( hasOverrides( block ) ) return true;
		return getHasOverridableBlocks( block.innerBlocks );
	} );
}

/**
 * Does the reverse of the `getContentValuesFromBlocks` function.
 *
 * Take the values from the pattern block's `content` attribute and applies them to the
 * inner blocks.
 *
 * Used to set the initial content of the inner blocks.
 *
 * @param {Array}  blocks               The pattern block's inner blocks.
 * @param {Object} content              The content values from the pattern block's `content` attribute.
 * @param {Object} defaultContentValues The default values for the content. These are the values
 *                                      stored in the unsaved wp_block post.
 *
 * @return {Array} The updated inner blocks.
 */
function applyInitialContentValues(
	blocks,
	content = {},
	defaultContentValues
) {
	return blocks.map( ( block ) => {
		const innerBlocks = applyInitialContentValues(
			block.innerBlocks,
			content,
			defaultContentValues
		);
		const blockId = block.attributes.metadata?.id;
		if ( ! hasOverrides( block ) || ! blockId )
			return { ...block, innerBlocks };
		const attributes = getOverrideAttributes( block );
		const newAttributes = { ...block.attributes };
		for ( const attributeKey of attributes ) {
			defaultContentValues[ blockId ] ??= { values: {} };
			defaultContentValues[ blockId ].values[ attributeKey ] =
				block.attributes[ attributeKey ];

			if ( content[ blockId ]?.values?.[ attributeKey ] !== undefined ) {
				newAttributes[ attributeKey ] =
					content[ blockId ]?.values?.[ attributeKey ];
			}
		}
		return {
			...block,
			attributes: newAttributes,
			innerBlocks,
		};
	} );
}

/**
 * Does the reverse of the `applyInitialContentValues` function.
 *
 * Recursively get the latest content values from the inner blocks.
 *
 * Used to set the `content` attribute of the pattern block.
 *
 * @param {Array}  blocks               The array of inner blocks.
 * @param {Object} defaultContentValues The default values for the content. These are the values
 *                                      stored in the unsaved wp_block post.
 *
 * @return {Object} The content values.
 */
function getContentValuesFromBlocks( blocks, defaultContentValues ) {
	/** @type {Record<string, Record<string, unknown>>} */
	const content = {};
	for ( const block of blocks ) {
		Object.assign(
			content,
			getContentValuesFromBlocks(
				block.innerBlocks,
				defaultContentValues
			)
		);
		const blockId = block.attributes.metadata?.id;
		if ( ! hasOverrides( block ) || ! blockId ) continue;
		const attributes = getOverrideAttributes( block );
		for ( const attributeKey of attributes ) {
			if (
				block.attributes[ attributeKey ] !==
				defaultContentValues[ blockId ][ attributeKey ]
			) {
				content[ blockId ] ??= { values: {} };
				// TODO: We need a way to represent `undefined` in the serialized content.
				// Also see: https://github.com/WordPress/gutenberg/pull/57249#discussion_r1452987871
				content[ blockId ].values[ attributeKey ] =
					block.attributes[ attributeKey ];
			}
		}
	}
	return Object.keys( content ).length > 0 ? content : undefined;
}

function setBlockEditMode( setEditMode, blocks, mode ) {
	blocks.forEach( ( block ) => {
		const editMode =
			mode || ( hasOverrides( block ) ? 'contentOnly' : 'disabled' );
		setEditMode( block.clientId, editMode );
		setBlockEditMode( setEditMode, block.innerBlocks, mode );
	} );
}

export default function ReusableBlockEdit( {
	name,
	attributes: { ref, content },
	__unstableParentLayout: parentLayout,
	clientId: patternClientId,
	setAttributes,
} ) {
	const registry = useRegistry();
	const hasAlreadyRendered = useHasRecursion( ref );
	const { record, editedRecord, hasResolved } = useEntityRecord(
		'postType',
		'wp_block',
		ref
	);
	const isMissing = hasResolved && ! record;
	const initialContent = useRef( content );
	const defaultValuesRef = useRef( {} );

	const {
		replaceInnerBlocks,
		__unstableMarkNextChangeAsNotPersistent,
		setBlockEditingMode,
	} = useDispatch( blockEditorStore );
	const { syncDerivedUpdates } = unlock( useDispatch( blockEditorStore ) );

	const { innerBlocks, userCanEdit, getBlockEditingMode, getPostLinkProps } =
		useSelect(
			( select ) => {
				const { canUser } = select( coreStore );
				const {
					getBlocks,
					getBlockEditingMode: editingMode,
					getSettings,
				} = select( blockEditorStore );
				const blocks = getBlocks( patternClientId );
				const canEdit = canUser( 'update', 'blocks', ref );

				// For editing link to the site editor if the theme and user permissions support it.
				return {
					innerBlocks: blocks,
					userCanEdit: canEdit,
					getBlockEditingMode: editingMode,
					getPostLinkProps: getSettings().getPostLinkProps,
				};
			},
			[ patternClientId, ref ]
		);

	const editOriginalProps = getPostLinkProps
		? getPostLinkProps( {
				postId: ref,
				postType: 'wp_block',
		  } )
		: {};

	useEffect(
		() => setBlockEditMode( setBlockEditingMode, innerBlocks ),
		[ innerBlocks, setBlockEditingMode ]
	);

	const hasOverridableBlocks = useMemo(
		() => getHasOverridableBlocks( innerBlocks ),
		[ innerBlocks ]
	);

	const initialBlocks = useMemo(
		() =>
			// Clone the blocks to generate new client IDs.
			editedRecord.blocks?.map( ( block ) => cloneBlock( block ) ) ??
			( editedRecord.content && typeof editedRecord.content !== 'function'
				? parse( editedRecord.content )
				: [] ),
		[ editedRecord.blocks, editedRecord.content ]
	);

	// Apply the initial content from the pattern block to the inner blocks.
	useEffect( () => {
		defaultValuesRef.current = {};
		const editingMode = getBlockEditingMode( patternClientId );

		registry.batch( () => {
			setBlockEditingMode( patternClientId, 'default' );
			syncDerivedUpdates( () => {
				replaceInnerBlocks(
					patternClientId,
					applyInitialContentValues(
						initialBlocks,
						initialContent.current,
						defaultValuesRef.current
					)
				);
			} );
			setBlockEditingMode( patternClientId, editingMode );
		} );
	}, [
		__unstableMarkNextChangeAsNotPersistent,
		patternClientId,
		initialBlocks,
		replaceInnerBlocks,
		registry,
		getBlockEditingMode,
		setBlockEditingMode,
		syncDerivedUpdates,
	] );

	const { alignment, layout } = useInferredLayout(
		innerBlocks,
		parentLayout
	);
	const layoutClasses = useLayoutClasses( { layout }, name );

	const blockProps = useBlockProps( {
		className: classnames(
			'block-library-block__reusable-block-container',
			layout && layoutClasses,
			{ [ `align${ alignment }` ]: alignment }
		),
	} );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		templateLock: 'all',
		layout,
		renderAppender: innerBlocks?.length
			? undefined
			: InnerBlocks.ButtonBlockAppender,
	} );

	// Sync the overridden attributes from the inner blocks to the pattern block's `content` attribute.
	// `syncDerivedUpdates` is used here to avoid creating an additional undo level.
	useEffect( () => {
		const { getBlocks } = registry.select( blockEditorStore );
		let prevBlocks = getBlocks( patternClientId );
		return registry.subscribe( () => {
			const blocks = getBlocks( patternClientId );
			if ( blocks !== prevBlocks ) {
				prevBlocks = blocks;
				syncDerivedUpdates( () => {
					setAttributes( {
						content: getContentValuesFromBlocks(
							blocks,
							defaultValuesRef.current
						),
					} );
				} );
			}
		}, blockEditorStore );
	}, [ syncDerivedUpdates, patternClientId, registry, setAttributes ] );

	const handleEditOriginal = ( event ) => {
		setBlockEditMode( setBlockEditingMode, innerBlocks, 'default' );
		editOriginalProps.onClick( event );
	};

	const resetContent = () => {
		if ( content ) {
			replaceInnerBlocks( patternClientId, initialBlocks );
		}
	};

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
			{ userCanEdit && editOriginalProps && (
				<BlockControls>
					<ToolbarGroup>
						<ToolbarButton
							href={ editOriginalProps.href }
							onClick={ handleEditOriginal }
						>
							{ __( 'Edit original' ) }
						</ToolbarButton>
					</ToolbarGroup>
				</BlockControls>
			) }

			{ hasOverridableBlocks && (
				<BlockControls>
					<ToolbarGroup>
						<ToolbarButton
							onClick={ resetContent }
							disabled={ ! content }
							__experimentalIsFocusable
						>
							{ __( 'Reset' ) }
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
