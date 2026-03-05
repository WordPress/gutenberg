/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useRef, useMemo } from '@wordpress/element';
import {
	useEntityRecord,
	store as coreStore,
	useEntityBlockEditor,
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
	RecursionProvider,
	useHasRecursion,
	useBlockProps,
	Warning,
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
	BlockControls,
	InnerBlocks,
} from '@wordpress/block-editor';
import { privateApis as patternsPrivateApis } from '@wordpress/patterns';
import { getBlockBindingsSource } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';

const { useLayoutClasses } = unlock( blockEditorPrivateApis );
const { isOverridableBlock } = unlock( patternsPrivateApis );

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

function RecursionWarning() {
	const blockProps = useBlockProps();
	return (
		<div { ...blockProps }>
			<Warning>
				{ __( 'Block cannot be rendered inside itself.' ) }
			</Warning>
		</div>
	);
}

const NOOP = () => {};

// Wrap the main Edit function for the pattern block with a recursion wrapper
// that allows short-circuiting rendering as early as possible, before any
// of the other effects in the block edit have run.
export default function ReusableBlockEditRecursionWrapper( props ) {
	const { ref, slug } = props.attributes;
	const uniqueId = ref || slug;
	const hasAlreadyRendered = useHasRecursion( uniqueId );

	if ( hasAlreadyRendered ) {
		return <RecursionWarning />;
	}

	return (
		<RecursionProvider uniqueId={ uniqueId }>
			<ReusableBlockEdit { ...props } />
		</RecursionProvider>
	);
}

const EMPTY_OBJECT = {};

function useCanOverrideBlocks( blocks ) {
	const { hasPatternOverridesSource, supportedBlockTypesRaw } = useSelect(
		( select ) => {
			const { getSettings } = select( blockEditorStore );
			return {
				hasPatternOverridesSource: !! getBlockBindingsSource(
					'core/pattern-overrides'
				),
				supportedBlockTypesRaw:
					getSettings()
						.__experimentalBlockBindingsSupportedAttributes ||
					EMPTY_OBJECT,
			};
		},
		[]
	);

	return useMemo( () => {
		const supportedBlockTypes = Object.keys( supportedBlockTypesRaw );
		const hasOverridableBlocks = ( _blocks ) =>
			_blocks.some( ( block ) => {
				if (
					supportedBlockTypes.includes( block.name ) &&
					isOverridableBlock( block )
				) {
					return true;
				}
				return hasOverridableBlocks( block.innerBlocks );
			} );
		return hasPatternOverridesSource && hasOverridableBlocks( blocks );
	}, [ hasPatternOverridesSource, blocks, supportedBlockTypesRaw ] );
}

function ReusableBlockEdit( {
	name,
	attributes: { ref, slug, content },
	__unstableParentLayout: parentLayout,
	setAttributes,
} ) {
	if ( slug && ! ref ) {
		return (
			<SlugPatternEdit
				name={ name }
				slug={ slug }
				content={ content }
				parentLayout={ parentLayout }
				setAttributes={ setAttributes }
			/>
		);
	}

	return (
		<RefPatternEdit
			name={ name }
			patternRef={ ref }
			content={ content }
			parentLayout={ parentLayout }
			setAttributes={ setAttributes }
		/>
	);
}

function PatternBlockUI( {
	name,
	blocks,
	hasResolved,
	isMissing,
	content,
	parentLayout,
	setAttributes,
	children: extraControls,
} ) {
	const { __unstableMarkLastChangeAsPersistent } =
		useDispatch( blockEditorStore );

	const canOverrideBlocks = useCanOverrideBlocks( blocks );

	const { alignment, layout } = useInferredLayout( blocks, parentLayout );
	const layoutClasses = useLayoutClasses( { layout }, name );

	const blockProps = useBlockProps( {
		className: clsx(
			'block-library-block__reusable-block-container',
			layout && layoutClasses,
			{ [ `align${ alignment }` ]: alignment }
		),
	} );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		layout,
		value: blocks,
		onInput: NOOP,
		onChange: NOOP,
		renderAppender: blocks?.length
			? undefined
			: InnerBlocks.ButtonBlockAppender,
	} );

	const resetContent = () => {
		if ( content ) {
			__unstableMarkLastChangeAsPersistent();
			setAttributes( { content: undefined } );
		}
	};

	let placeholder = null;

	if ( isMissing ) {
		placeholder = (
			<Warning>
				{ __( 'Block has been deleted or is unavailable.' ) }
			</Warning>
		);
	}

	if ( ! hasResolved ) {
		placeholder = (
			<Placeholder>
				<Spinner />
			</Placeholder>
		);
	}

	return (
		<>
			{ hasResolved && ! isMissing && (
				<>
					{ extraControls }
					{ canOverrideBlocks && (
						<BlockControls group="other">
							<ToolbarGroup>
								<ToolbarButton
									onClick={ resetContent }
									disabled={ ! content }
								>
									{ __( 'Reset' ) }
								</ToolbarButton>
							</ToolbarGroup>
						</BlockControls>
					) }
				</>
			) }

			{ placeholder === null ? (
				<div { ...innerBlocksProps } />
			) : (
				<div { ...blockProps }>{ placeholder }</div>
			) }
		</>
	);
}

function RefPatternEdit( {
	name,
	patternRef,
	content,
	parentLayout,
	setAttributes,
} ) {
	const { record, hasResolved } = useEntityRecord(
		'postType',
		'wp_block',
		patternRef
	);
	const [ blocks ] = useEntityBlockEditor( 'postType', 'wp_block', {
		id: patternRef,
	} );
	const isMissing = hasResolved && ! record;

	const onNavigateToEntityRecord = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return getSettings().onNavigateToEntityRecord;
	}, [] );

	const handleEditOriginal = onNavigateToEntityRecord
		? () => {
				onNavigateToEntityRecord( {
					postId: patternRef,
					postType: 'wp_block',
				} );
		  }
		: undefined;

	return (
		<PatternBlockUI
			name={ name }
			blocks={ blocks }
			hasResolved={ hasResolved }
			isMissing={ isMissing }
			content={ content }
			parentLayout={ parentLayout }
			setAttributes={ setAttributes }
		>
			<EditOriginalControl
				recordId={ patternRef }
				handleEditOriginal={ handleEditOriginal }
			/>
		</PatternBlockUI>
	);
}

function SlugPatternEdit( {
	name,
	slug,
	content,
	parentLayout,
	setAttributes,
} ) {
	const { blocks, hasResolved, isMissing } = useSelect(
		( select ) => {
			const pattern =
				select( blockEditorStore ).__experimentalGetParsedPattern(
					slug
				);
			if ( pattern ) {
				return {
					blocks: pattern.blocks,
					hasResolved: true,
					isMissing: false,
				};
			}
			// Pattern not found — check whether the REST API patterns
			// have finished loading before declaring it missing.
			const patternsLoaded =
				select( coreStore ).hasFinishedResolution( 'getBlockPatterns' );
			return {
				blocks: [],
				hasResolved: patternsLoaded,
				isMissing: patternsLoaded,
			};
		},
		[ slug ]
	);

	return (
		<PatternBlockUI
			name={ name }
			blocks={ blocks }
			hasResolved={ hasResolved }
			isMissing={ isMissing }
			content={ content }
			parentLayout={ parentLayout }
			setAttributes={ setAttributes }
		/>
	);
}

function EditOriginalControl( { recordId, handleEditOriginal } ) {
	const canUserEdit = useSelect(
		( select ) =>
			!! select( coreStore ).canUser( 'update', {
				kind: 'postType',
				name: 'wp_block',
				id: recordId,
			} ),
		[ recordId ]
	);

	if ( ! canUserEdit || ! handleEditOriginal ) {
		return null;
	}

	return (
		<BlockControls group="other">
			<ToolbarGroup>
				<ToolbarButton onClick={ handleEditOriginal }>
					{ __( 'Edit original' ) }
				</ToolbarButton>
			</ToolbarGroup>
		</BlockControls>
	);
}
