/**
 * WordPress dependencies
 */
import {
	useEntityBlockEditor,
	useEntityProp,
	useEntityRecord,
} from '@wordpress/core-data';
import {
	Placeholder,
	Spinner,
	TextControl,
	PanelBody,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	useInnerBlocksProps,
	__experimentalRecursionProvider as RecursionProvider,
	__experimentalUseHasRecursion as useHasRecursion,
	InnerBlocks,
	InspectorControls,
	store as blockEditorStore,
	useBlockProps,
	Warning,
} from '@wordpress/block-editor';
import { useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

export default function ReusableBlockEdit( {
	attributes: { ref },
	clientId,
	setAttributes,
} ) {
	const { __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );

	// To leverage updateBlockAttributes in the pattern block support we need
	// an ID, otherwise we'd need to pass a setter down through context.
	// The `clientId` is a prop and so can't be passed directly through block
	// context. Instead, we set this on a dedicated block attribute.
	useEffect( () => {
		__unstableMarkNextChangeAsNotPersistent();
		setAttributes( { patternId: clientId } );
	}, [] );

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

	const blockProps = useBlockProps( {
		className: 'block-library-block__reusable-block-container',
	} );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		value: blocks,
		onInput,
		onChange,
		renderAppender: blocks?.length
			? undefined
			: InnerBlocks.ButtonBlockAppender,
	} );

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
		<RecursionProvider uniqueId={ ref }>
			<InspectorControls>
				<PanelBody>
					<TextControl
						__nextHasNoMarginBottom
						label={ __( 'Name' ) }
						value={ title }
						onChange={ setTitle }
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...innerBlocksProps } />
		</RecursionProvider>
	);
}
