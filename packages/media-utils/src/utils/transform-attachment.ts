/**
 * Internal dependencies
 */
import type { Attachment, RestAttachment } from './types';

/**
 * Transforms an attachment object from the REST API shape into the shape expected by the block editor and other consumers.
 *
 * @param attachment REST API attachment object.
 */
export function transformAttachment( attachment: RestAttachment ): Attachment {
	// eslint-disable-next-line camelcase
	const { alt_text, source_url, ...savedMediaProps } = attachment;
	return {
		...savedMediaProps,
		alt: attachment.alt_text,
		caption: attachment.caption?.raw ?? '',
		title: attachment.title.raw,
		url: attachment.source_url,
		poster:
			attachment._embedded?.[ 'wp:featuredmedia' ]?.[ 0 ]?.source_url ||
			undefined,
	};
}
