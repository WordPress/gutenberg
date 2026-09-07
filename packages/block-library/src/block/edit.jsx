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
import {
	privateApis as patternsPrivateApis,
	store as patternsStore,
} from '@wordpress/patterns';
import { getBlockBindingsSource, parse } from '@wordpress/blocks';
import { unlock } from '../lock-unlock';

const { useLayoutClasses } = unlock( blockEditorPrivateApis );
const EMPTY_ARRAY = [];
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
	// `ref` points at a user pattern (a `wp_block` post), `slug` at a
	// registered pattern. `ref` wins when both are set.
	const uniqueId = ref || slug;
	const hasAlreadyRendered = useHasRecursion( uniqueId );

	if ( hasAlreadyRendered ) {
		return <RecursionWarning />;
	}

	return (
		<RecursionProvider uniqueId={ uniqueId }>
			{ ref ? (
				<UserPatternEdit { ...props } recordId={ ref } />
			) : (
				<RegisteredPatternEdit { ...props } />
			) }
		</RecursionProvider>
	);
}

/**
 * Loads a user pattern (a `wp_block` post) referenced by `ref`.
 *
 * @param {Object} props          Block edit props.
 * @param {number} props.recordId The `wp_block` post id.
 */
function UserPatternEdit( { recordId, ...props } ) {
	const { record, hasResolved } = useEntityRecord(
		'postType',
		'wp_block',
		recordId
	);
	const [ blocks ] = useEntityBlockEditor( 'postType', 'wp_block', {
		id: recordId,
	} );
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
		<ReusableBlockEdit
			{ ...props }
			blocks={ blocks }
			hasResolved={ hasResolved }
			isMissing={ hasResolved && ! record }
			canUserEdit={ canUserEdit }
			onEditOriginal={ ( navigate ) => navigate( recordId ) }
		/>
	);
}

/**
 * Loads a registered pattern (theme, plugin or core) referenced by `slug`.
 * When the pattern has been edited, the edited copy (a `wp_block` post) is
 * loaded instead so the instance follows edits live.
 *
 * @param {Object} props Block edit props.
 */
function RegisteredPatternEdit( props ) {
	const { slug } = props.attributes;
	const { pattern, customization, hasResolved, canCreate } = useSelect(
		( select ) => {
			const _pattern = unlock(
				select( blockEditorStore )
			).getPatternBySlug( slug );
			const { canUser, hasFinishedResolution } = select( coreStore );
			return {
				pattern: _pattern,
				customization: unlock(
					select( patternsStore )
				).getPatternCustomization( slug ),
				hasResolved:
					!! _pattern || hasFinishedResolution( 'getBlockPatterns' ),
				canCreate: !! canUser( 'create', {
					kind: 'postType',
					name: 'wp_block',
				} ),
			};
		},
		[ slug ]
	);
	const { customizePattern } = unlock( useDispatch( patternsStore ) );
	const content = pattern?.content;
	// Parse the raw content rather than using the shared parsed pattern, so
	// the root block isn't stamped with `metadata.patternName` and treated as
	// an unsynced pattern instance.
	const blocks = useMemo(
		() =>
			content
				? parse( content, { __unstableSkipMigrationLogs: true } )
				: EMPTY_ARRAY,
		[ content ]
	);

	if ( customization ) {
		return <UserPatternEdit { ...props } recordId={ customization.id } />;
	}

	return (
		<ReusableBlockEdit
			{ ...props }
			blocks={ blocks }
			hasResolved={ hasResolved }
			isMissing={ hasResolved && ! pattern }
			canUserEdit={ canCreate && !! pattern }
			// Editing a registered pattern creates its editable copy first.
			onEditOriginal={ async ( navigate ) => {
				const record = await customizePattern( pattern );
				navigate( record.id );
			} }
		/>
	);
}

function ReusableBlockControl( {
	canUserEdit,
	canOverrideBlocks,
	hasContent,
	handleEditOriginal,
	resetContent,
} ) {
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

function ReusableBlockEdit( {
	name,
	attributes: { ref, content },
	__unstableParentLayout: parentLayout,
	setAttributes,
	blocks,
	hasResolved,
	isMissing,
	canUserEdit,
	onEditOriginal,
} ) {
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
		onEditOriginal( ( postId ) =>
			onNavigateToEntityRecord( { postId, postType: 'wp_block' } )
		);
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
				{ ref
					? __( 'Block has been deleted or is unavailable.' )
					: __(
							'The pattern this block references is not registered by the active theme or plugins.'
					  ) }
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
					canUserEdit={ canUserEdit }
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
