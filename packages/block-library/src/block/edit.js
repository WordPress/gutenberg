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
} from '@wordpress/core-data';
import {
	Placeholder,
	Spinner,
	TextControl,
	PanelBody,
} from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import {
	useInnerBlocksProps,
	__experimentalRecursionProvider as RecursionProvider,
	__experimentalUseHasRecursion as useHasRecursion,
	InnerBlocks,
	InspectorControls,
	useBlockProps,
	Warning,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useEffect, useState } from '@wordpress/element';

const fullAlignments = [ 'full', 'wide', 'left', 'right' ];

export default function ReusableBlockEdit( {
	attributes,
	setAttributes,
	__unstableParentLayout,
} ) {
	const { ref } = attributes;
	const [ inferredAlignment, setInferredAlignment ] = useState();

	const { __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );
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

	useEffect( () => {
		// We only track the initial alignment so that if the user could
		// initially apply wide or full alignments to inner blocks, that ability
		// is maintained even if they temporarily remove the last inner block
		// with that wide/full alignment.
		if ( ! blocks?.length || inferredAlignment !== undefined ) {
			return;
		}

		const isConstrained = __unstableParentLayout.type === 'constrained';
		const hasFullAlignment = blocks.some( ( block ) =>
			fullAlignments.includes( block.attributes.align )
		);
		const alignment = isConstrained && hasFullAlignment ? 'full' : null;

		setInferredAlignment( alignment );
		__unstableMarkNextChangeAsNotPersistent();
		setAttributes( {
			layout: alignment ? __unstableParentLayout : undefined,
		} );
	}, [
		blocks,
		inferredAlignment,
		setAttributes,
		__unstableMarkNextChangeAsNotPersistent,
		__unstableParentLayout,
	] );

	const blockProps = useBlockProps( {
		className: classnames(
			'block-library-block__reusable-block-container',
			{ [ `align${ inferredAlignment }` ]: !! inferredAlignment }
		),
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
