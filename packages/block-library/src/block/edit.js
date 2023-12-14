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
	__experimentalRecursionProvider as RecursionProvider,
	__experimentalUseHasRecursion as useHasRecursion,
	InnerBlocks,
	useBlockProps,
	Warning,
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
	BlockControls,
} from '@wordpress/block-editor';
import { getBlockSupport, parse } from '@wordpress/blocks';
import { store as editorStore } from '@wordpress/editor';
import { addQueryArgs, getQueryArgs, removeQueryArgs } from '@wordpress/url';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';

const { useLayoutClasses } = unlock( blockEditorPrivateApis );

function isPartiallySynced( block ) {
	return (
		!! getBlockSupport( block.name, '__experimentalConnections', false ) &&
		!! block.attributes.connections?.attributes &&
		Object.values( block.attributes.connections.attributes ).some(
			( connection ) => connection.source === 'pattern_attributes'
		)
	);
}
function getPartiallySyncedAttributes( block ) {
	return Object.entries( block.attributes.connections.attributes )
		.filter(
			( [ , connection ] ) => connection.source === 'pattern_attributes'
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
			defaultValues[ blockId ] = block.attributes[ attributeKey ];
			if ( overrides[ blockId ] ) {
				newAttributes[ attributeKey ] = overrides[ blockId ];
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
	/** @type {Record<string, unknown>} */
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
				block.attributes[ attributeKey ] !== defaultValues[ blockId ]
			) {
				overrides[ blockId ] = block.attributes[ attributeKey ];
			}
		}
	}
	return Object.keys( overrides ).length > 0 ? overrides : undefined;
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

function editSourcePattern(
	setRenderingMode,
	patternId,
	createSuccessNotice,
	defaultRenderingMode
) {
	const currentArgs = getQueryArgs( window.location.href );
	const currentUrlWithoutArgs = removeQueryArgs(
		window.location.href,
		...Object.keys( currentArgs )
	);
	const newUrl = addQueryArgs( currentUrlWithoutArgs, {
		...currentArgs,
		patternId,
	} );
	window.history.pushState( null, '', newUrl );
	setRenderingMode( 'pattern-only' );
	createSuccessNotice(
		__(
			'Editing source pattern. Changes made here affect all posts and pages that use this pattern. Changes will not show in the post/page editor until you save the pattern.'
		),
		{
			type: 'snackbar',
			actions: [
				{
					label: __( 'Go back' ),
					onClick: () => setRenderingMode( defaultRenderingMode ),
				},
			],
		}
	);
}

export default function ReusableBlockEdit( {
	name,
	attributes: { ref, overrides },
	__unstableParentLayout: parentLayout,
	clientId: patternClientId,
} ) {
	const { setRenderingMode } = useDispatch( editorStore );
	const registry = useRegistry();
	const hasAlreadyRendered = useHasRecursion( ref );
	const { record, hasResolved } = useEntityRecord(
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
	const { createSuccessNotice } = useDispatch( noticesStore );

	const {
		innerBlocks,
		userCanEdit,
		getBlockEditingMode,
		defaultRenderingMode,
	} = useSelect(
		( select ) => {
			const { canUser } = select( coreStore );
			const { getBlocks, getBlockEditingMode: editingMode } =
				select( blockEditorStore );
			const { getEditorSettings } = select( editorStore );
			const blocks = getBlocks( patternClientId );
			const canEdit = canUser( 'update', 'blocks', ref );
			const defaultRenderMode = getEditorSettings().defaultRenderingMode;

			// For editing link to the site editor if the theme and user permissions support it.
			return {
				innerBlocks: blocks,
				userCanEdit: canEdit,
				getBlockEditingMode: editingMode,
				defaultRenderingMode: defaultRenderMode,
			};
		},
		[ patternClientId, ref ]
	);

	useEffect(
		() => setBlockEditMode( setBlockEditingMode, innerBlocks ),
		[ innerBlocks, setBlockEditingMode ]
	);

	useEffect( () => {
		if ( ! record?.content?.raw ) return;
		const initialBlocks = parse( record.content.raw );

		const editingMode = getBlockEditingMode( patternClientId );
		registry.batch( () => {
			setBlockEditingMode( patternClientId, 'default' );
			__unstableMarkNextChangeAsNotPersistent();
			replaceInnerBlocks(
				patternClientId,
				applyInitialOverrides(
					initialBlocks,
					initialOverrides.current,
					defaultValuesRef.current
				)
			);
			setBlockEditingMode( patternClientId, editingMode );
		} );
	}, [
		__unstableMarkNextChangeAsNotPersistent,
		patternClientId,
		record,
		replaceInnerBlocks,
		registry,
		getBlockEditingMode,
		setBlockEditingMode,
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
		layout,
		renderAppender: innerBlocks?.length
			? undefined
			: InnerBlocks.ButtonBlockAppender,
	} );

	// Sync the `overrides` attribute from the updated blocks.
	// `syncDerivedBlockAttributes` is an action that just like `updateBlockAttributes`
	// but won't create an undo level.
	// This can be abstracted into a `useSyncDerivedAttributes` hook if needed.
	useEffect( () => {
		const { getBlocks } = registry.select( blockEditorStore );
		const { syncDerivedBlockAttributes } = unlock(
			registry.dispatch( blockEditorStore )
		);
		let prevBlocks = getBlocks( patternClientId );
		return registry.subscribe( () => {
			const blocks = getBlocks( patternClientId );
			if ( blocks !== prevBlocks ) {
				prevBlocks = blocks;
				syncDerivedBlockAttributes( patternClientId, {
					overrides: getOverridesFromBlocks(
						blocks,
						defaultValuesRef.current
					),
				} );
			}
		}, blockEditorStore );
	}, [ patternClientId, registry ] );

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
						<ToolbarButton
							onClick={ () =>
								editSourcePattern(
									setRenderingMode,
									ref,
									createSuccessNotice,
									defaultRenderingMode
								)
							}
						>
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
