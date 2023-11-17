/**
 * External dependencies
 */
import classnames from 'classnames';
import fastDeepEqual from 'fast-deep-equal';

/**
 * WordPress dependencies
 */
import { useRegistry, useSelect, useDispatch } from '@wordpress/data';
import { useRef, useMemo, useEffect } from '@wordpress/element';
import { useEntityProp, useEntityRecord } from '@wordpress/core-data';
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
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { getBlockSupport, parse } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';

const { useLayoutClasses } = unlock( blockEditorPrivateApis );

function hasAttributeSynced( block ) {
	return (
		!! getBlockSupport( block.name, '__experimentalConnections', false ) &&
		!! block.attributes.connections?.attributes &&
		Object.values( block.attributes.connections.attributes ).some(
			( connection ) => connection.source === 'pattern_attributes'
		)
	);
}
function getAttributeSynced( block ) {
	const attributes = {};
	for ( const [ attribute, connection ] of Object.entries(
		block.attributes.connections.attributes
	) ) {
		if ( connection.source !== 'pattern_attributes' ) continue;
		attributes[ attribute ] = connection.value;
	}
	return attributes;
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

function applyInitialDynamicContent(
	blocks,
	dynamicContent = {},
	defaultValues
) {
	return blocks.map( ( block ) => {
		const innerBlocks = applyInitialDynamicContent(
			block.innerBlocks,
			dynamicContent,
			defaultValues
		);
		if ( ! hasAttributeSynced( block ) ) return { ...block, innerBlocks };
		const attributes = getAttributeSynced( block );
		const newAttributes = { ...block.attributes };
		for ( const [ attributeKey, id ] of Object.entries( attributes ) ) {
			defaultValues[ id ] = block.attributes[ attributeKey ];
			if ( dynamicContent[ id ] ) {
				newAttributes[ attributeKey ] = dynamicContent[ id ];
			}
		}
		return {
			...block,
			attributes: newAttributes,
			innerBlocks,
		};
	} );
}

function getDynamicContentFromBlocks( blocks, defaultValues ) {
	/** @type {Record<string, unknown>} */
	const dynamicContent = {};
	for ( const block of blocks ) {
		Object.assign(
			dynamicContent,
			getDynamicContentFromBlocks( block.innerBlocks, defaultValues )
		);
		if ( ! hasAttributeSynced( block ) ) continue;
		const attributes = getAttributeSynced( block );
		for ( const [ attributeKey, id ] of Object.entries( attributes ) ) {
			if ( block.attributes[ attributeKey ] !== defaultValues[ id ] ) {
				dynamicContent[ id ] = block.attributes[ attributeKey ];
			}
		}
	}
	return Object.keys( dynamicContent ).length > 0
		? dynamicContent
		: undefined;
}

export default function ReusableBlockEdit( {
	name,
	attributes: { ref, dynamicContent },
	__unstableParentLayout: parentLayout,
	clientId: patternClientId,
} ) {
	const registry = useRegistry();
	const hasAlreadyRendered = useHasRecursion( ref );
	const { record, hasResolved } = useEntityRecord(
		'postType',
		'wp_block',
		ref
	);
	const isMissing = hasResolved && ! record;
	const initialDynamicContent = useRef( dynamicContent );
	const defaultValuesRef = useRef( {} );
	const {
		replaceInnerBlocks,
		__unstableMarkNextChangeAsNotPersistent,
		setBlockEditingMode,
	} = useDispatch( blockEditorStore );
	const { getBlockEditingMode } = useSelect( blockEditorStore );

	useEffect( () => {
		if ( ! record?.content?.raw ) return;
		const initialBlocks = parse( record.content.raw );

		const editingMode = getBlockEditingMode( patternClientId );
		registry.batch( () => {
			setBlockEditingMode( patternClientId, 'default' );
			__unstableMarkNextChangeAsNotPersistent();
			replaceInnerBlocks(
				patternClientId,
				applyInitialDynamicContent(
					initialBlocks,
					initialDynamicContent.current,
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

	const innerBlocks = useSelect(
		( select ) => select( blockEditorStore ).getBlocks( patternClientId ),
		[ patternClientId ]
	);

	const [ title, setTitle ] = useEntityProp(
		'postType',
		'wp_block',
		'title',
		ref
	);

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

	// Sync the `dynamicContent` attribute from the updated blocks.
	// `syncDerivedBlockAttributes` is an action that just like `updateBlockAttributes`
	// but won't create an undo level.
	// This can be abstracted into a `useSyncDerivedAttributes` hook if needed.
	useEffect( () => {
		const { getBlocks, getBlockAttributes } =
			registry.select( blockEditorStore );
		const { syncDerivedBlockAttributes } = unlock(
			registry.dispatch( blockEditorStore )
		);
		let prevBlocks = getBlocks( patternClientId );
		return registry.subscribe( () => {
			const blocks = getBlocks( patternClientId );
			if ( blocks !== prevBlocks ) {
				prevBlocks = blocks;
				const nextDynamicContent = getDynamicContentFromBlocks(
					blocks,
					defaultValuesRef.current
				);
				if (
					! fastDeepEqual(
						getBlockAttributes( patternClientId ).dynamicContent,
						nextDynamicContent
					)
				) {
					syncDerivedBlockAttributes( patternClientId, {
						dynamicContent: nextDynamicContent,
					} );
				}
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
