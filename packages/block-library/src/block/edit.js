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

function isPartiallySynced( block ) {
	return (
		Object.keys( PARTIAL_SYNCING_SUPPORTED_BLOCKS ).includes(
			block.name
		) &&
		!! block.attributes.metadata?.bindings &&
		Object.values( block.attributes.metadata.bindings ).some(
			( binding ) => binding.source === 'core/pattern-overrides'
		)
	);
}
function getPartiallySyncedAttributes( block ) {
	return Object.entries( block.attributes.metadata.bindings )
		.filter(
			( [ , binding ] ) => binding.source === 'core/pattern-overrides'
		)
		.map( ( [ attributeKey ] ) => attributeKey );
}

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

function applyInitialOverrides( blocks, overrides = {}, defaultValues ) {
	return blocks.map( ( block ) => {
		const innerBlocks = applyInitialOverrides(
			block.innerBlocks,
			overrides,
			defaultValues
		);
		const blockId = block.attributes.metadata?.id;
		if ( ! isPartiallySynced( block ) || ! blockId )
			return { ...block, innerBlocks };
		const attributes = getPartiallySyncedAttributes( block );
		const newAttributes = { ...block.attributes };
		for ( const attributeKey of attributes ) {
			defaultValues[ blockId ] ??= {};
			defaultValues[ blockId ][ attributeKey ] =
				block.attributes[ attributeKey ];
			if ( overrides[ blockId ]?.[ attributeKey ] !== undefined ) {
				newAttributes[ attributeKey ] =
					overrides[ blockId ][ attributeKey ];
			}
		}
		return {
			...block,
			attributes: newAttributes,
			innerBlocks,
		};
	} );
}

function getOverridesFromBlocks( blocks, defaultValues ) {
	/** @type {Record<string, Record<string, unknown>>} */
	const overrides = {};
	for ( const block of blocks ) {
		Object.assign(
			overrides,
			getOverridesFromBlocks( block.innerBlocks, defaultValues )
		);
		const blockId = block.attributes.metadata?.id;
		if ( ! isPartiallySynced( block ) || ! blockId ) continue;
		const attributes = getPartiallySyncedAttributes( block );
		for ( const attributeKey of attributes ) {
			if (
				block.attributes[ attributeKey ] !==
				defaultValues[ blockId ][ attributeKey ]
			) {
				overrides[ blockId ] ??= {};
				// TODO: We need a way to represent `undefined` in the serialized overrides.
				// Also see: https://github.com/WordPress/gutenberg/pull/57249#discussion_r1452987871
				overrides[ blockId ][ attributeKey ] =
					block.attributes[ attributeKey ];
			}
		}
	}
	return Object.keys( overrides ).length > 0 ? overrides : undefined;
}

function setBlockEditMode( setEditMode, blocks, mode ) {
	blocks.forEach( ( block ) => {
		const editMode =
			mode || ( isPartiallySynced( block ) ? 'contentOnly' : 'disabled' );
		setEditMode( block.clientId, editMode );
		setBlockEditMode( setEditMode, block.innerBlocks, mode );
	} );
}

function getHasOverridableBlocks( blocks ) {
	return blocks.some( ( block ) => {
		if ( isPartiallySynced( block ) ) return true;
		return getHasOverridableBlocks( block.innerBlocks );
	} );
}

export default function ReusableBlockEdit( {
	name,
	attributes: { ref, overrides },
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
	const initialOverrides = useRef( overrides );
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

	// Apply the initial overrides from the pattern block to the inner blocks.
	useEffect( () => {
		defaultValuesRef.current = {};
		const editingMode = getBlockEditingMode( patternClientId );
		// Replace the contents of the blocks with the overrides.
		registry.batch( () => {
			setBlockEditingMode( patternClientId, 'default' );
			syncDerivedUpdates( () => {
				replaceInnerBlocks(
					patternClientId,
					applyInitialOverrides(
						initialBlocks,
						initialOverrides.current,
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

	// Sync the `overrides` attribute from the updated blocks to the pattern block.
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
						overrides: getOverridesFromBlocks(
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

	const resetOverrides = () => {
		if ( overrides ) {
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
							onClick={ resetOverrides }
							disabled={ ! overrides }
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
