/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import {
	useEntityBlockEditor,
	useEntityProp,
	store as coreStore,
} from '@wordpress/core-data';
import {
	Placeholder,
	Spinner,
	ToolbarGroup,
	ToolbarButton,
	TextControl,
	PanelBody,
	Disabled,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import {
	__experimentalUseInnerBlocksProps as useInnerBlocksProps,
	__experimentalUseNoRecursiveRenders as useNoRecursiveRenders,
	InnerBlocks,
	BlockControls,
	InspectorControls,
	useBlockProps,
	Warning,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { store as reusableBlocksStore } from '@wordpress/reusable-blocks';
import { ungroup } from '@wordpress/icons';

export default function ReusableBlockEdit( { attributes: { ref }, clientId } ) {
	const [ hasAlreadyRendered, RecursionProvider ] = useNoRecursiveRenders(
		ref
	);
	const { isMissing, hasResolved, parentBlockName } = useSelect(
		( select ) => {
			const persistedBlock = select( coreStore ).getEntityRecord(
				'postType',
				'wp_block',
				ref
			);
			const hasResolvedBlock = select(
				coreStore
			).hasFinishedResolution( 'getEntityRecord', [
				'postType',
				'wp_block',
				ref,
			] );

			const {
				getSelectedBlockClientId,
				getBlockName,
				getBlockParents,
			} = select( blockEditorStore );

			const currentBlockId = getSelectedBlockClientId();
			const parents = getBlockParents( currentBlockId );
			const _firstParentClientId = parents[ parents.length - 1 ];
			const _parentBlockName = getBlockName( _firstParentClientId );

			return {
				hasResolved: hasResolvedBlock,
				isMissing: hasResolvedBlock && ! persistedBlock,
				parentBlockName: _parentBlockName,
			};
		},
		[ ref, clientId ]
	);

	const {
		__experimentalConvertBlockToStatic: convertBlockToStatic,
	} = useDispatch( reusableBlocksStore );

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

	const innerBlocksProps = useInnerBlocksProps(
		{},
		{
			value: blocks,
			onInput,
			onChange,
			renderAppender: blocks?.length
				? undefined
				: InnerBlocks.ButtonBlockAppender,
		}
	);

	const blockProps = useBlockProps();

	// state for lock
	const [ isLocked, setIsLocked ] = useState( true );

	let innerBlocks = <div { ...innerBlocksProps } />;
	if ( isLocked ) {
		innerBlocks = <Disabled> { innerBlocks } </Disabled>;
	}

	const lockContainerClass = isLocked ? 'is-locked' : 'is-unlocked';

	// lock the blocks when deselected
	useEffect( () => {
		const isInnerBlock = parentBlockName === 'core/block'; // first check if selectedblock is inner block
		if ( ! isInnerBlock ) {
			setIsLocked( true );
		}
	}, [ parentBlockName ] );

	if ( hasAlreadyRendered ) {
		return (
			<div { ...blockProps }>
				<Warning>
					{ __( 'Block cannot be rendered inside itself.' ) }
				</Warning>
			</div>
		);
	}

	if ( isMissing ) {
		return (
			<div { ...blockProps }>
				<Warning>
					{ __( 'Block has been deleted or is unavailable.' ) }
				</Warning>
			</div>
		);
	}

	if ( ! hasResolved ) {
		return (
			<div { ...blockProps }>
				<Placeholder>
					<Spinner />
				</Placeholder>
			</div>
		);
	}

	return (
		<RecursionProvider>
			<div { ...blockProps }>
				<BlockControls>
					<ToolbarGroup>
						<ToolbarButton
							onClick={ () => convertBlockToStatic( clientId ) }
							label={ __( 'Convert to regular blocks' ) }
							icon={ ungroup }
							showTooltip
						/>
					</ToolbarGroup>
				</BlockControls>
				<InspectorControls>
					<PanelBody>
						<TextControl
							label={ __( 'Name' ) }
							value={ title }
							onChange={ setTitle }
						/>
					</PanelBody>
				</InspectorControls>
				<div
					className="block-library-block__reusable-block-container"
					role="button"
					tabIndex={ 0 }
					onClick={ () => setIsLocked( false ) }
					onKeyDown={ ( e ) => {
						if ( e.key === 85 ) {
							setIsLocked( false );
						}
					} }
				>
					<div
						className={ `reusable-block-lock-container ${ lockContainerClass }` }
					></div>
					{ innerBlocks }
				</div>
			</div>
		</RecursionProvider>
	);
}
