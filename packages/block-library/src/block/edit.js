/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { RegistryProvider, useRegistry, useSelect } from '@wordpress/data';
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
import { store as blocksStore } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';

function hasAttributeSynced( registry, block ) {
	return registry
		.select( blocksStore )
		.hasBlockSupport( block.name, '__experimentalPattern' );
}
function getAttributeSynced( registry, block ) {
	return registry
		.select( blocksStore )
		.getBlockSupport( block.name, '__experimentalPattern' );
}

const updateBlockAttributes =
	( patternClientId, blockIdsMap ) =>
	( clientIds, attributes, uniqueByBlock = false ) =>
	( { select, dispatch, registry } ) => {
		const updates = {};
		for ( const clientId of [].concat( clientIds ) ) {
			const attrs = uniqueByBlock ? attributes[ clientId ] : attributes;
			const parentPattern = select.getBlock( patternClientId );
			const block = select.getBlock( clientId );
			if ( ! parentPattern || ! hasAttributeSynced( registry, block ) ) {
				updates[ clientId ] = attrs;
				continue;
			}

			const contentAttributes = getAttributeSynced( registry, block );
			const dynamicContent = {};
			const updatedAttributes = {};
			for ( const attributeKey of Object.keys( attrs ) ) {
				if ( Object.hasOwn( contentAttributes, attributeKey ) ) {
					dynamicContent[ attributeKey ] = attrs[ attributeKey ];
				} else {
					updatedAttributes[ attributeKey ] = attrs[ attributeKey ];
				}
			}
			if ( Object.keys( dynamicContent ).length > 0 ) {
				const id = blockIdsMap[ block.clientId ];

				updates[ parentPattern.clientId ] = {
					dynamicContent: {
						...parentPattern.attributes.dynamicContent,
						[ id ]: dynamicContent,
					},
				};
			}
			if ( Object.keys( updatedAttributes ).length > 0 ) {
				updates[ clientId ] = updatedAttributes;
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
	const { useLayoutClasses } = unlock( blockEditorPrivateApis );
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

	const blockIdsMap = useSelect(
		( select ) => {
			const blockClientIds = select(
				blockEditorStore
			).getClientIdsOfDescendants( [ patternClientId ] );
			let blockIds = record?.meta?.block_ids;
			if ( blockIds?.length !== blockClientIds.length ) {
				// Fallback to preorder-based ids.
				blockIds = Array.from(
					{ length: blockClientIds.length },
					( _, index ) => index + 1
				);
			}
			const map = {};
			blockClientIds.forEach( ( clientId, index ) => {
				map[ clientId ] = blockIds[ index ];
			} );
			return map;
		},
		[ patternClientId, record?.meta ]
	);

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
			_selectAttributes( clientId, attributes ) {
				const id = blockIdsMap[ clientId ];
				const { dynamicContent } = registry
					.select( blockEditorStore )
					.getBlockAttributes( patternClientId );
				if ( ! dynamicContent?.[ id ] ) return attributes;
				return {
					...attributes,
					...dynamicContent[ id ],
				};
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
						return updateBlockAttributes(
							patternClientId,
							blockIdsMap
						)(
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
	}, [ registry, patternClientId, blockIdsMap ] );

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
		<RegistryProvider value={ subRegistry }>
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
		</RegistryProvider>
	);
}
