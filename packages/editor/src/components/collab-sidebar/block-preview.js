/**
 * WordPress dependencies
 */
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import { getCommentExcerpt } from './utils';

const NOTE_PREVIEW_IMAGE_GETTERS = {
	'core/image': ( attributes ) => {
		if ( attributes.url ) {
			return {
				url: attributes.url,
			};
		}
	},
	'core/cover': ( attributes ) => {
		if ( attributes.backgroundType === 'image' && attributes.url ) {
			return {
				url: attributes.url,
			};
		}
	},
	'core/media-text': ( attributes ) => {
		if ( attributes.mediaType === 'image' && attributes.mediaUrl ) {
			return {
				url: attributes.mediaUrl,
			};
		}
	},
};

function normalizePreviewText( text ) {
	const normalizedText = stripHTML( String( text ) )
		.replace( /\s+/g, ' ' )
		.trim();

	if ( ! normalizedText ) {
		return null;
	}

	return getCommentExcerpt( normalizedText, 10 );
}

/**
 * Derives a compact preview of the block linked to a note thread.
 *
 * @param {string} blockName       Block name.
 * @param {Object} [attributes={}] Block attributes.
 * @return {Object|null} A preview object or null when no preview can be derived.
 */
export function getNoteBlockPreview( blockName, attributes = {} ) {
	if ( ! blockName || ! attributes ) {
		return null;
	}

	const getImagePreview = NOTE_PREVIEW_IMAGE_GETTERS[ blockName ];
	const imagePreview = getImagePreview?.( attributes );
	if ( imagePreview?.url ) {
		return {
			type: 'image',
			url: imagePreview.url,
		};
	}

	const source = attributes.content ?? attributes.value ?? attributes.text;
	const sourceText =
		typeof source === 'string' ? source : source?.text ?? source?.content;
	const text =
		typeof sourceText === 'string'
			? normalizePreviewText( sourceText )
			: null;

	if ( text ) {
		return {
			type: 'text',
			text,
		};
	}

	return null;
}

/**
 * Extracts a persisted note preview from comment meta.
 *
 * Supports either object payloads or JSON strings under known keys.
 *
 * @param {Object} [meta={}] Comment meta object.
 * @return {Object|null} A normalized preview object or null.
 */
export function getNoteBlockPreviewFromMeta( meta = {} ) {
	const previewValue = meta?._wp_noted_content ?? meta?._wp_note_preview;

	if ( ! previewValue ) {
		return null;
	}

	let parsedPreview = previewValue;

	if ( typeof parsedPreview === 'string' ) {
		try {
			parsedPreview = JSON.parse( parsedPreview );
		} catch {
			const text = normalizePreviewText( parsedPreview );
			return text ? { type: 'text', text } : null;
		}
	}

	if ( ! parsedPreview || typeof parsedPreview !== 'object' ) {
		return null;
	}

	if ( parsedPreview.url ) {
		return {
			type: 'image',
			url: parsedPreview.url,
		};
	}

	const textSource = parsedPreview.text ?? parsedPreview.content;
	if ( typeof textSource === 'string' ) {
		const text = normalizePreviewText( textSource );
		if ( text ) {
			return {
				type: 'text',
				text,
			};
		}
	}

	return null;
}
