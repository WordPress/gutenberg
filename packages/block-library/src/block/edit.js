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
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	__experimentalUseInnerBlocksProps as useInnerBlocksProps,
	__experimentalUseNoRecursiveRenders as useNoRecursiveRenders,
	__experimentalBlockContentOverlay as BlockContentOverlay,
	InnerBlocks,
	BlockControls,
	InspectorControls,
	useBlockProps,
	Warning,
} from '@wordpress/block-editor';
import { store as reusableBlocksStore } from '@wordpress/reusable-blocks';
import { ungroup, lock } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import ReusableBlockWelcomeGuide from './reusable-block-welcome-guide';

export default function ReusableBlockEdit( { attributes: { ref }, clientId } ) {
	const [ hasAlreadyRendered, RecursionProvider ] = useNoRecursiveRenders(
		ref
	);
	const { isMissing, hasResolved, hasEdits } = useSelect(
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
			const blockHasEdits = select( coreStore ).hasEditsForEntityRecord(
				'postType',
				'wp_block',
				ref
			);
			return {
				hasResolved: hasResolvedBlock,
				isMissing: hasResolvedBlock && ! persistedBlock,
				hasEdits: blockHasEdits,
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

	const blockProps = useBlockProps();

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
	n;
	// local states for gudie modal
	const [ isGudieOpen, setIsGudieOpen ] = useState( false );

	const { saveEditedEntityRecord } = useDispatch( coreStore );
	const { createNotice } = useDispatch( noticesStore );

	// save the unsaved records
	const saveEditedRecords = () => {
		saveEditedEntityRecord( 'postType', 'wp_block', ref );
		showSnackbar();
	};

	const showSnackbar = () => {
		createNotice( 'success', __( 'Reusable block saved.' ), {
			type: 'snackbar',
			isDismissible: true,
			actions: [
				{
					label: __( 'Learn more' ),
					onClick: () => setIsGudieOpen( true ),
				},
			],
		} );
	};

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
					<ToolbarGroup>
						<ToolbarButton
							isPrimary
							style={ {
								margin: '7px',
								height: '34px',
							} }
							onClick={ saveEditedRecords }
							label={ __( 'Save Globally' ) }
							showTooltip
							isDisabled={ ! hasEdits }
						>
							{ __( 'Save' ) }
						</ToolbarButton>
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
				<BlockContentOverlay
					clientId={ clientId }
					wrapperProps={ innerBlocksProps }
					className="block-library-block__reusable-block-container"
				/>
				{ isGudieOpen && (
					<ReusableBlockWelcomeGuide
						isGudieOpen={ isGudieOpen }
						setIsGudieOpen={ setIsGudieOpen }
					/>
				) }
			</div>
		</RecursionProvider>
	);
}
