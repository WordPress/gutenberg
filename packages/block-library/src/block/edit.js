/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	useEntityBlockEditor,
	useEntityProp,
	useEntityRecord,
	store as coreStore,
} from '@wordpress/core-data';
import {
	Placeholder,
	Spinner,
	TextControl,
	PanelBody,
	ToolbarButton,
	ToolbarGroup,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	useInnerBlocksProps,
	__experimentalRecursionProvider as RecursionProvider,
	__experimentalUseHasRecursion as useHasRecursion,
	InnerBlocks,
	InspectorControls,
	useBlockProps,
	Warning,
	privateApis as blockEditorPrivateApis,
	BlockControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { useRef, useMemo, useState, useEffect } from '@wordpress/element';

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

function setBlockEditMode( setEditMode, blocks, isEditingSourcePattern ) {
	blocks.forEach( ( block ) => {
		if ( isEditingSourcePattern ) {
			setEditMode( block.clientId, 'default' );
			setBlockEditMode( setEditMode, block.innerBlocks );
			return;
		}
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
	clientId: patternClientId,
} ) {
	const [ isEditingSourcePattern, setIsEditingSourcePattern ] =
		useState( false );
	const { setBlockEditingMode } = useDispatch( blockEditorStore );
	const { innerBlocks, userCanEdit } = useSelect(
		( select ) => {
			const { canUser } = select( coreStore );
			const { getBlocks } = select( blockEditorStore );
			const blocks = getBlocks( patternClientId );
			const canEdit = canUser( 'update', 'blocks', ref );

			return {
				innerBlocks: blocks,
				userCanEdit: canEdit,
			};
		},
		[ patternClientId, ref ]
	);

	useEffect( () => {
		setBlockEditMode(
			setBlockEditingMode,
			innerBlocks,
			isEditingSourcePattern
		);
	}, [ innerBlocks, setBlockEditingMode, isEditingSourcePattern ] );

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

	const [ title, setTitle ] = useEntityProp(
		'postType',
		'wp_block',
		'title',
		ref
	);

	const { alignment, layout } = useInferredLayout( blocks, parentLayout );
	const layoutClasses = useLayoutClasses( { layout }, name );

	const blockProps = useBlockProps( {
		className: classnames(
			'block-library-block__reusable-block-container',
			layout && layoutClasses,
			{
				[ `align${ alignment }` ]: alignment,
				'is-editing-source': isEditingSourcePattern,
			}
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
						<ToolbarButton
							onClick={ () =>
								setIsEditingSourcePattern(
									! isEditingSourcePattern
								)
							}
						>
							{ isEditingSourcePattern
								? __( 'Stop editing parent' )
								: __( 'Edit parent pattern' ) }
						</ToolbarButton>
					</ToolbarGroup>
				</BlockControls>
			) }
			<InspectorControls>
				<PanelBody>
					<TextControl
						label={ __( 'Name' ) }
						value={ title }
						onChange={ setTitle }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
				</PanelBody>
			</InspectorControls>
			{ children === null ? (
				<div { ...innerBlocksProps } />
			) : (
				<div { ...blockProps }>{ children }</div>
			) }
		</RecursionProvider>
	);
}
