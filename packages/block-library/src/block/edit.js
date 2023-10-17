/**
 * WordPress dependencies
 */
import { RegistryProvider, useRegistry, useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
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
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { store as blocksStore } from '@wordpress/blocks';

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

export default function ReusableBlockEdit( {
	attributes: { ref },
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

	const blockIdsMap = useSelect(
		( select ) => {
			const blockClientIds = select(
				blockEditorStore
			).getClientIdsOfDescendants( [ patternClientId ] );
			const blockIds =
				record?.meta?.blockIds ??
				Array.from(
					{ length: blockClientIds.length },
					( _, i ) => i + 1
				);
			const map = {};
			blockClientIds.forEach( ( clientId, index ) => {
				map[ clientId ] = blockIds[ index ];
			} );
			return map;
		},
		[ patternClientId, record?.meta ]
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
