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
const { hasOverridableBlocks } = unlock( patternsPrivateApis );

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
	const { ref } = props.attributes;
	const hasAlreadyRendered = useHasRecursion( ref );

	if ( hasAlreadyRendered ) {
		return <RecursionWarning />;
	}

	return (
		<RecursionProvider uniqueId={ ref }>
			<ReusableBlockEdit { ...props } />
		</RecursionProvider>
	);
}

function ReusableBlockControl( {
	recordId,
	canOverrideBlocks,
	hasContent,
	handleEditOriginal,
	resetContent,
} ) {
	const canUserEdit = useSelect(
		( select ) =>
			!! select( coreStore ).canUser( 'update', {
				kind: 'postType',
				name: 'wp_block',
				id: recordId,
			} ),
		[ recordId ]
	);

	return (
		<>
			{ canUserEdit && !! handleEditOriginal && (
				<BlockControls>
					<ToolbarGroup>
						<ToolbarButton onClick={ handleEditOriginal }>
							{ __( 'Edit original' ) }
						</ToolbarButton>
					</ToolbarGroup>
				</BlockControls>
			) }

			{ canOverrideBlocks && (
				<BlockControls>
					<ToolbarGroup>
						<ToolbarButton
							onClick={ resetContent }
							disabled={ ! hasContent }
						>
							{ __( 'Reset' ) }
						</ToolbarButton>
					</ToolbarGroup>
				</BlockControls>
			) }
		</>
	);
}

function ReusableBlockEdit( {
	name,
	attributes: { ref, content },
	__unstableParentLayout: parentLayout,
	setAttributes,
} ) {
	const { record, hasResolved } = useEntityRecord(
		'postType',
		'wp_block',
		ref
	);
	const [ blocks ] = useEntityBlockEditor( 'postType', 'wp_block', {
		id: ref,
	} );
	const isMissing = hasResolved && ! record;

	const { __unstableMarkLastChangeAsPersistent } =
		useDispatch( blockEditorStore );

	const { onNavigateToEntityRecord, hasPatternOverridesSource } = useSelect(
		( select ) => {
			const { getSettings } = select( blockEditorStore );
			// For editing link to the site editor if the theme and user permissions support it.
			return {
				onNavigateToEntityRecord:
					getSettings().onNavigateToEntityRecord,
				hasPatternOverridesSource: !! getBlockBindingsSource(
					'core/pattern-overrides'
				),
			};
		},
		[]
	);

	const canOverrideBlocks = useMemo(
		() => hasPatternOverridesSource && hasOverridableBlocks( blocks ),
		[ hasPatternOverridesSource, blocks ]
	);

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

	const handleEditOriginal = () => {
		onNavigateToEntityRecord( {
			postId: ref,
			postType: 'wp_block',
		} );
	};

	const resetContent = () => {
		if ( content ) {
			// Make sure any previous changes are persisted before resetting.
			__unstableMarkLastChangeAsPersistent();
			setAttributes( { content: undefined } );
		}
	};

	let children = null;

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
		<>
			{ hasResolved && ! isMissing && (
				<ReusableBlockControl
					recordId={ ref }
					canOverrideBlocks={ canOverrideBlocks }
					hasContent={ !! content }
					handleEditOriginal={
						onNavigateToEntityRecord
							? handleEditOriginal
							: undefined
					}
					resetContent={ resetContent }
				/>
			) }

			{ children === null ? (
				<div { ...innerBlocksProps } />
			) : (
				<div { ...blockProps }>{ children }</div>
			) }
		</>
	);
}
