/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { RegistryProvider, useRegistry } from '@wordpress/data';
import { useRef, useMemo } from '@wordpress/element';
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
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { getBlockSupport } from '@wordpress/blocks';

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

const updateBlockAttributes =
	( patternClientId ) =>
	( clientIds, attributes, uniqueByBlock = false ) =>
	( { select, dispatch } ) => {
		const updates = {};
		for ( const clientId of [].concat( clientIds ) ) {
			const attrs = uniqueByBlock ? attributes[ clientId ] : attributes;
			const parentPattern = select.getBlock( patternClientId );
			const block = select.getBlock( clientId );
			if ( ! parentPattern || ! hasAttributeSynced( block ) ) {
				continue;
			}

			const contentAttributes = getAttributeSynced( block );
			const dynamicContent = {};
			for ( const attributeKey of Object.keys( attrs ) ) {
				if ( Object.hasOwn( contentAttributes, attributeKey ) ) {
					dynamicContent[ contentAttributes[ attributeKey ] ] =
						attrs[ attributeKey ];
				}
			}
			if ( Object.keys( dynamicContent ).length > 0 ) {
				updates[ parentPattern.clientId ] = {
					dynamicContent: {
						...parentPattern.attributes.dynamicContent,
						...dynamicContent,
					},
				};
			}
		}

		if (
			Object.values( updates ).every(
				( updatedAttributes, _index, arr ) =>
					updatedAttributes === arr[ 0 ]
			)
		) {
			dispatch.updateBlockAttributes(
				Object.keys( updates ),
				Object.values( updates )[ 0 ],
				false
			);
		} else {
			dispatch.updateBlockAttributes(
				Object.keys( updates ),
				updates,
				true
			);
		}
	};

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

export default function ReusableBlockEdit( {
	name,
	attributes: { ref },
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
			{ [ `align${ alignment }` ]: alignment }
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

	const subRegistry = useMemo( () => {
		return {
			...registry,
			_selectAttributes( block ) {
				if ( ! hasAttributeSynced( block ) ) return block.attributes;
				const { dynamicContent } = registry
					.select( blockEditorStore )
					.getBlockAttributes( patternClientId );
				if ( ! dynamicContent ) return block.attributes;
				const attributeIds = getAttributeSynced( block );
				const newAttributes = { ...block.attributes };
				for ( const [ attributeKey, id ] of Object.entries(
					attributeIds
				) ) {
					if ( dynamicContent[ id ] ) {
						newAttributes[ attributeKey ] = dynamicContent[ id ];
					}
				}
				return newAttributes;
			},
			dispatch( store ) {
				if (
					store !== blockEditorStore &&
					store !== blockEditorStore.name
				) {
					return registry.dispatch( store );
				}
				const dispatch = registry.dispatch( store );
				const select = registry.select( store );
				return {
					...dispatch,
					updateBlockAttributes(
						clientId,
						attributes,
						uniqueByBlock
					) {
						return updateBlockAttributes( patternClientId )(
							clientId,
							attributes,
							uniqueByBlock
						)( {
							registry,
							select,
							dispatch,
						} );
					},
				};
			},
		};
	}, [ registry, patternClientId ] );

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
		<RegistryProvider value={ subRegistry }>
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
		</RegistryProvider>
	);
}
