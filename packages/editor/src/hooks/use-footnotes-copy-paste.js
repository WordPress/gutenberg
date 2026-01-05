/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { parse, serialize, createBlock } from '@wordpress/blocks';
import {
	extractFootnotesForCopy,
	mergeFootnotesOnPaste,
} from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../store';

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

				// Check if pasted blocks contain a footnotes block
				// If so, extract its footnotes and remove it from pasted blocks
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

				// Merge footnotes from both sources (copied footnotes + footnotes from pasted footnotes block)
				// Deduplicate by ID to avoid duplicates
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

				// Merge footnotes - this updates footnote IDs in pasted blocks
				const result = mergeFootnotesOnPaste(
					blocksToPaste,
					allCopiedFootnotes,
					destinationBlocks
				);

				// Update clipboard HTML with blocks that have updated footnote IDs
				// (excluding the footnotes block if it was in the pasted content)
				const updatedHtml = serialize( result.blocks );
				event.clipboardData.setData( 'text/html', updatedHtml );

				// Wait for paste to complete, then update footnotes block
				// setTimeout ensures the block editor's paste handler has finished
				// and blocks are actually inserted before we update
				setTimeout( () => {
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

					// Get current blocks after paste - this includes any footnotes
					// that were already added from previous pastes
					const currentBlocks = getBlocks();

					// Check if footnotes block already exists (search recursively)
					const existingFootnotesBlock =
						findFootnotesBlockRecursive( currentBlocks );

					// Get the NEW footnotes that were just added in this paste
					// (not all footnotes from destinationBlocks, which includes existing ones)
					const newFootnotesFromPaste = result.newFootnotes || [];

					// Get current footnotes (if any) - these are the footnotes already in the editor
					const currentFootnotes =
						existingFootnotesBlock?.attributes?.footnotes || [];

					// Merge footnotes: start with current, add only the NEW ones
					// Use a Map to ensure each ID appears only once
					const footnotesMap = new Map();

					// Add all current footnotes first (deduplicate if they have duplicates)
					currentFootnotes.forEach( ( fn ) => {
						// Only keep the first occurrence of each ID
						if ( ! footnotesMap.has( fn.id ) ) {
							footnotesMap.set( fn.id, fn );
						}
					} );

					// Add ONLY the new footnotes from this paste
					// These already have unique IDs generated by mergeFootnotesOnPaste
					newFootnotesFromPaste.forEach( ( fn ) => {
						// Only add if ID doesn't exist (shouldn't happen, but safety check)
						if ( ! footnotesMap.has( fn.id ) ) {
							footnotesMap.set( fn.id, fn );
						}
					} );

					// Convert to array - guaranteed unique IDs
					// Final deduplication: ensure absolutely no duplicates by ID
					// This is critical - React requires unique keys
					const finalFootnotesMap = new Map();
					Array.from( footnotesMap.values() ).forEach( ( fn ) => {
						// If ID already exists, skip it (keep first occurrence)
						if ( ! finalFootnotesMap.has( fn.id ) ) {
							finalFootnotesMap.set( fn.id, fn );
						}
					} );
					const deduplicatedFootnotes = Array.from(
						finalFootnotesMap.values()
					);

					// Final safety check: verify no duplicates
					const ids = new Set();
					const trulyUniqueFootnotes = deduplicatedFootnotes.filter(
						( fn ) => {
							if ( ids.has( fn.id ) ) {
								// Duplicate found - skip it
								return false;
							}
							ids.add( fn.id );
							return true;
						}
					);

					// Merge the footnotes block into current blocks
					if ( existingFootnotesBlock ) {
						// Update existing footnotes block
						const updatedBlocks = currentBlocks.map( ( block ) => {
							if ( block.name === 'core/footnotes' ) {
								return {
									...block,
									attributes: {
										...block.attributes,
										footnotes: trulyUniqueFootnotes,
									},
								};
							}
							return block;
						} );
						// Update all blocks through the entity editor to persist changes
						resetEditorBlocks( updatedBlocks );
					} else {
						// Add new footnotes block at the end
						const newFootnotesBlock = createBlock(
							'core/footnotes',
							{
								footnotes: trulyUniqueFootnotes,
							}
						);
						const updatedBlocks = [
							...currentBlocks,
							newFootnotesBlock,
						];
						// Update all blocks through the entity editor to persist changes
						resetEditorBlocks( updatedBlocks );
					}
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
