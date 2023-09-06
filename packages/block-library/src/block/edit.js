/**
 * External dependencies
 */
import classNames from 'classnames';

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
	useBlockProps,
	Warning,
} from '@wordpress/block-editor';
import { useEffect, useState } from '@wordpress/element';

export default function ReusableBlockEdit( {
	attributes: { ref },
	setAttributes,
} ) {
	const [ inheritedAlignment, setInheritedAlignment ] = useState();
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

	const alignments = [ 'wide', 'full' ];

	useEffect( () => {
		// Determine the widest setting of all the contained blocks.
		const widestAlignment = blocks.reduce( ( accumulator, block ) => {
			const { align } = block.attributes;
			return alignments.indexOf( align ) >
				alignments.indexOf( accumulator )
				? align
				: accumulator;
		}, undefined );
		// If we don't have a wide or full alignment set we can remove the default layout attribute
		if ( ! alignments.includes( widestAlignment ) ) {
			setAttributes( {
				layout: undefined,
			} );
			setInheritedAlignment( undefined );
			return;
		}
		// Set the align class of the pattern block to match the widest
		// alignment of children.
		setAttributes( {
			layout: { type: 'constrained' },
		} );
		setInheritedAlignment( widestAlignment );
	}, [ blocks ] );

	const blockProps = useBlockProps( {
		className: classNames(
			'block-library-block__reusable-block-container',
			{ [ `align${ inheritedAlignment }` ]: inheritedAlignment }
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
