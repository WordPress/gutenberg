/**
 * WordPress dependencies
 */
import { createAtomStore } from '@wordpress/stan';

/**
 * Internal dependencies
 */
import { PREFERENCES_DEFAULTS, SETTINGS_DEFAULTS } from './defaults';

export const blockMetadataByClientId = createAtomStore( {} );
export const blockAttributesByClientId = createAtomStore( {} );
export const blockOrderByClientId = createAtomStore( {} );
export const controlledInnerBlocks = createAtomStore( {} );
export const isTyping = createAtomStore( false );
export const draggedBlocks = createAtomStore( [] );
export const isCaretWithinFormattedText = createAtomStore( false );
export const selectionStart = createAtomStore( {} );
export const selectionEnd = createAtomStore( {} );
export const isMultiSelecting = createAtomStore( false );
export const isSelectionEnabled = createAtomStore( false );
export const initialPosition = createAtomStore();
export const blocksModeByClientId = createAtomStore( {} );
export const insertionPoint = createAtomStore( null );
export const insertionPointVisibility = createAtomStore( false );
export const template = createAtomStore( { isValid: true } );
export const settings = createAtomStore( SETTINGS_DEFAULTS );
export const preferences = createAtomStore( PREFERENCES_DEFAULTS );
export const blockListSettingsByClientId = createAtomStore( {} );
export const isNavigationMode = createAtomStore( false );
export const hasBlockMovingClientId = createAtomStore( false );
export const lastBlockAttributesChange = createAtomStore();
export const automaticChangeStatus = createAtomStore();
export const highlightedBlock = createAtomStore();
