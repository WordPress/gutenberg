import clsx from 'clsx';
import { useSelect, useDispatch } from '@wordpress/data';
import { useRef, useMemo } from '@wordpress/element';
import {
	useEntityRecord,
	store as coreStore,
	useEntityBlockEditor,
} from '@wordpress/core-data';
import {
	Placeholder,
	Spinner as WCSpinner,
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
import { getBlockBindingsSource, parse } from '@wordpress/blocks';
import { unlock } from '../lock-unlock';
import EditOriginalInspectorButton from '../utils/edit-original-inspector-button';

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
				<BlockControls group="other">
					<ToolbarGroup>
						<ToolbarButton onClick={ handleEditOriginal }>
							{ __( 'Edit original' ) }
						</ToolbarButton>
					</ToolbarGroup>
				</BlockControls>
			) }

			{ canOverrideBlocks && (
				<BlockControls group="other">
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

const EMPTY_OBJECT = {};
const EMPTY_ARRAY = [];

function ReusableBlockEdit( {
	name,
	clientId,
	attributes: { ref, content },
	__unstableParentLayout: parentLayout,
	setAttributes,
} ) {
	const { record, hasResolved } = useEntityRecord(
		'postType',
		'wp_block',
		ref
	);
	const [ editableBlocks ] = useEntityBlockEditor( 'postType', 'wp_block', {
		id: ref,
	} );

	// A user who can read the pattern but not edit it can't load it in the
	// `edit` context. Its `view` context has the content too, so render that.
	const isUnavailableToEdit = hasResolved && ! record;
	const { readOnlyRecord, hasResolvedReadOnly } = useSelect(
		( select ) => {
			if ( ! isUnavailableToEdit ) {
				return {};
			}
			const args = [ 'postType', 'wp_block', ref, { context: 'view' } ];
			const { getEntityRecord, hasFinishedResolution } =
				select( coreStore );
			return {
				readOnlyRecord: getEntityRecord( ...args ),
				hasResolvedReadOnly: hasFinishedResolution(
					'getEntityRecord',
					args
				),
			};
		},
		[ isUnavailableToEdit, ref ]
	);
	const readOnlyContent = readOnlyRecord?.content?.raw;
	const readOnlyBlocks = useMemo(
		() => ( readOnlyContent ? parse( readOnlyContent ) : EMPTY_ARRAY ),
		[ readOnlyContent ]
	);
	const blocks = editableBlocks?.length ? editableBlocks : readOnlyBlocks;
	const isResolving = isUnavailableToEdit
		? ! hasResolvedReadOnly
		: ! hasResolved;
	const isMissing = ! isResolving && ! record && ! readOnlyRecord;

	const { __unstableMarkLastChangeAsPersistent } =
		useDispatch( blockEditorStore );

	const {
		onNavigateToEntityRecord,
		hasPatternOverridesSource,
		supportedBlockTypesRaw,
	} = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		// For editing link to the site editor if the theme and user permissions support it.
		return {
			onNavigateToEntityRecord: getSettings().onNavigateToEntityRecord,
			hasPatternOverridesSource: !! getBlockBindingsSource(
				'core/pattern-overrides'
			),
			supportedBlockTypesRaw:
				getSettings().__experimentalBlockBindingsSupportedAttributes ||
				EMPTY_OBJECT,
		};
	}, [] );

	const canOverrideBlocks = useMemo( () => {
		const supportedBlockTypes = Object.keys( supportedBlockTypesRaw );
		const hasOverridableBlocks = ( _blocks ) =>
			_blocks?.some( ( block ) => {
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

	if ( isResolving ) {
		children = (
			<Placeholder>
				<WCSpinner />
			</Placeholder>
		);
	}

	return (
		<>
			{ ! isResolving && ! isMissing && (
				<>
					<EditOriginalInspectorButton
						clientId={ clientId }
						postType="wp_block"
						postId={ ref }
					/>
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
				</>
			) }

			{ children === null ? (
				<div { ...innerBlocksProps } />
			) : (
				<div { ...blockProps }>{ children }</div>
			) }
		</>
	);
}
