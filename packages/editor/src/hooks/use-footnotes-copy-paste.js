/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { parse, createBlock } from '@wordpress/blocks';
import { RichTextData } from '@wordpress/rich-text';
import { privateApis as coreDataPrivateApis } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../store';
import { unlock } from '../lock-unlock';

const {
	extractFootnotesForCopy,
	mergeFootnotesOnPaste,
	getFootnotesOrder,
	updateBlocksAttributesForNumbering,
} = unlock( coreDataPrivateApis );

/**
 * Hook to handle footnote copy/paste functionality.
 * Extracts footnotes when copying blocks and merges them when pasting.
 */
export default function useFootnotesCopyPaste() {
	const { getBlocks, getSelectedBlockClientIds, getBlocksByClientId } =
		useSelect( blockEditorStore );
	const { resetEditorBlocks } = useDispatch( editorStore );

	return useRefEffect(
		( node ) => {
			function handlePaste( event ) {
				// Check if footnotes were copied
				const footnotesData = event.clipboardData.getData(
					'application/x-wordpress-footnotes'
				);
				if ( ! footnotesData ) {
					return;
				}

				let copiedFootnotes;
				try {
					copiedFootnotes = JSON.parse( footnotesData );
				} catch ( e ) {
					return;
				}

				if (
					! Array.isArray( copiedFootnotes ) ||
					copiedFootnotes.length === 0
				) {
					return;
				}

				// Get HTML from clipboard
				const html = event.clipboardData.getData( 'text/html' );
				if ( ! html || ! html.includes( '<!-- wp:' ) ) {
					return;
				}

				// Parse blocks that will be pasted
				let pastedBlocks;
				try {
					pastedBlocks = parse( html, {
						__unstableSkipAutop: true,
					} );
				} catch ( e ) {
					return;
				}

				if (
					! Array.isArray( pastedBlocks ) ||
					pastedBlocks.length === 0
				) {
					return;
				}

				// Extract footnotes from any footnotes blocks in pasted content
				const footnotesFromPastedBlocks = [];

				function extractFootnotesBlock( blocks ) {
					const filtered = [];
					for ( const block of blocks ) {
						if ( block.name === 'core/footnotes' ) {
							// Extract footnotes from the pasted footnotes block
							if ( block.attributes?.footnotes ) {
								footnotesFromPastedBlocks.push(
									...block.attributes.footnotes
								);
							}
							// Don't include the footnotes block in pasted blocks
							continue;
						}
						// Recursively process inner blocks
						const processedBlock = {
							...block,
							innerBlocks: block.innerBlocks
								? extractFootnotesBlock( block.innerBlocks )
								: block.innerBlocks,
						};
						filtered.push( processedBlock );
					}
					return filtered;
				}

				const blocksToPaste = extractFootnotesBlock( pastedBlocks );

				// Merge footnotes from both sources and deduplicate
				const allCopiedFootnotesMap = new Map();
				[ ...copiedFootnotes, ...footnotesFromPastedBlocks ].forEach(
					( fn ) => {
						if ( ! allCopiedFootnotesMap.has( fn.id ) ) {
							allCopiedFootnotesMap.set( fn.id, fn );
						}
					}
				);
				const allCopiedFootnotes = Array.from(
					allCopiedFootnotesMap.values()
				);

				// Get destination blocks BEFORE paste
				const destinationBlocks = getBlocks();

				// Calculate ID mapping and new footnotes
				const result = mergeFootnotesOnPaste(
					blocksToPaste,
					allCopiedFootnotes,
					destinationBlocks
				);

				// Store the ID mapping and new footnotes for use after paste completes
				const idMapping = result.idMapping;
				const newFootnotes = result.newFootnotes || [];

				// Wait for paste to complete, then update pasted blocks and footnotes block
				setTimeout( () => {
					const currentBlocks = getBlocks();

					// Helper to recursively update footnote IDs in block attributes
					function updateBlockFootnoteIds( block ) {
						const updatedAttributes = updateAttributeIds(
							block.attributes
						);
						return {
							...block,
							attributes: updatedAttributes,
							innerBlocks: block.innerBlocks
								? block.innerBlocks.map(
										updateBlockFootnoteIds
								  )
								: block.innerBlocks,
						};
					}

					function updateAttributeIds( attributes ) {
						if (
							! attributes ||
							Array.isArray( attributes ) ||
							typeof attributes !== 'object'
						) {
							return attributes;
						}

						attributes = { ...attributes };

						for ( const key in attributes ) {
							const value = attributes[ key ];

							if ( Array.isArray( value ) ) {
								attributes[ key ] =
									value.map( updateAttributeIds );
								continue;
							}

							if (
								typeof value !== 'string' &&
								! ( value instanceof RichTextData )
							) {
								continue;
							}

							const richTextValue =
								typeof value === 'string'
									? RichTextData.fromHTMLString( value )
									: new RichTextData( value );

							let hasChanges = false;

							richTextValue.replacements.forEach(
								( replacement ) => {
									if (
										replacement?.type === 'core/footnote'
									) {
										const oldId =
											replacement.attributes[ 'data-fn' ];
										const newId = idMapping[ oldId ];

										if ( newId && newId !== oldId ) {
											// Update the footnote ID
											replacement.attributes[
												'data-fn'
											] = newId;
											// Update the innerHTML to reflect new ID in the link
											replacement.innerHTML =
												replacement.innerHTML.replace(
													/href="#[^"]+"/,
													`href="#${ newId }"`
												);
											replacement.innerHTML =
												replacement.innerHTML.replace(
													/id="[^"]+-link"/,
													`id="${ newId }-link"`
												);
											hasChanges = true;
										}
									}
								}
							);

							if ( hasChanges ) {
								attributes[ key ] =
									typeof value === 'string'
										? richTextValue.toHTMLString()
										: richTextValue;
							}
						}

						return attributes;
					}

					// Update all blocks to fix footnote references in pasted content
					let updatedBlocks = currentBlocks.map(
						updateBlockFootnoteIds
					);

					// Helper to recursively find footnotes block
					function findFootnotesBlockRecursive( blocks ) {
						for ( const block of blocks ) {
							if ( block.name === 'core/footnotes' ) {
								return block;
							}
							if ( block.innerBlocks ) {
								const found = findFootnotesBlockRecursive(
									block.innerBlocks
								);
								if ( found ) {
									return found;
								}
							}
						}
						return null;
					}

					// Find or create footnotes block
					const existingFootnotesBlock =
						findFootnotesBlockRecursive( updatedBlocks );
					const currentFootnotes =
						existingFootnotesBlock?.attributes?.footnotes || [];

					// Merge current footnotes with new ones, ensuring unique IDs
					const footnotesMap = new Map();

					// Add existing footnotes first
					currentFootnotes.forEach( ( fn ) => {
						footnotesMap.set( fn.id, fn );
					} );

					// Add new footnotes (these have unique IDs from mergeFootnotesOnPaste)
					newFootnotes.forEach( ( fn ) => {
						footnotesMap.set( fn.id, fn );
					} );

					const mergedFootnotes = Array.from( footnotesMap.values() );

					// Update or create footnotes block
					if ( existingFootnotesBlock ) {
						updatedBlocks = updatedBlocks.map( ( block ) => {
							if ( block.name === 'core/footnotes' ) {
								return {
									...block,
									attributes: {
										...block.attributes,
										footnotes: mergedFootnotes,
									},
								};
							}
							return block;
						} );
					} else {
						const newFootnotesBlock = createBlock(
							'core/footnotes',
							{
								footnotes: mergedFootnotes,
							}
						);
						updatedBlocks = [ ...updatedBlocks, newFootnotesBlock ];
					}

					// Update footnote numbering based on the new order
					const newOrder = getFootnotesOrder( updatedBlocks );
					const finalBlocks = updateBlocksAttributesForNumbering(
						updatedBlocks,
						newOrder
					);

					// Apply all updates
					resetEditorBlocks( finalBlocks );
				}, 0 );
			}

			// Use capture phase to run BEFORE block editor's handler
			// Get selected blocks directly from store instead of parsing HTML
			function handleCopySync( event ) {
				// Get selected blocks directly from store
				const selectedBlockClientIds = getSelectedBlockClientIds();
				if ( selectedBlockClientIds.length === 0 ) {
					return;
				}

				// Get the actual block objects
				const copiedBlocks = getBlocksByClientId(
					selectedBlockClientIds
				);
				if ( ! copiedBlocks || copiedBlocks.length === 0 ) {
					return;
				}

				// Get all blocks to find footnotes block
				const allBlocks = getBlocks();

				// Extract footnotes referenced in copied blocks
				const copiedFootnotes = extractFootnotesForCopy(
					copiedBlocks,
					allBlocks
				);

				// Store footnotes in clipboard as custom data
				if ( copiedFootnotes.length > 0 ) {
					event.clipboardData.setData(
						'application/x-wordpress-footnotes',
						JSON.stringify( copiedFootnotes )
					);
				}
			}

			// Use capture phase (true) to run BEFORE block editor's handler
			// This allows us to set clipboard data before preventDefault is called
			node.ownerDocument.addEventListener( 'copy', handleCopySync, true );
			node.ownerDocument.addEventListener( 'paste', handlePaste, true );

			return () => {
				node.ownerDocument.removeEventListener(
					'copy',
					handleCopySync,
					true
				);
				node.ownerDocument.removeEventListener(
					'paste',
					handlePaste,
					true
				);
			};
		},
		[
			getBlocks,
			getSelectedBlockClientIds,
			getBlocksByClientId,
			resetEditorBlocks,
		]
	);
}
