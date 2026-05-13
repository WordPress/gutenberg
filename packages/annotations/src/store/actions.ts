/**
 * External dependencies
 */
import { v4 as uuid } from 'uuid';

/**
 * Internal dependencies
 */
import type { AddAnnotationParameters, AnnotationAction } from '../types';

/**
 * Adds an annotation to a block.
 *
 * The `block` attribute refers to a block ID that needs to be annotated.
 * `isBlockAnnotation` controls whether or not the annotation is a block
 * annotation. The `source` is the source of the annotation, this will be used
 * to identify groups of annotations.
 *
 * The `range` property is only relevant if the selector is 'range'.
 *
 * @param annotation                    The annotation to add.
 * @param annotation.blockClientId      The blockClientId to add the annotation to.
 * @param annotation.richTextIdentifier Identifier for the RichText instance the annotation applies to.
 * @param annotation.range              The range at which to apply this annotation.
 * @param annotation.selector           The way to apply this annotation.
 * @param annotation.source             The source that added the annotation.
 * @param annotation.id                 The ID the annotation should have. Generates a UUID by default.
 * @return Action object.
 */
export function __experimentalAddAnnotation( {
	blockClientId,
	richTextIdentifier = null,
	range = null,
	selector = 'range',
	source = 'default',
	id = uuid(),
}: AddAnnotationParameters ): AnnotationAction {
	const action: AnnotationAction = {
		type: 'ANNOTATION_ADD',
		id,
		blockClientId,
		richTextIdentifier,
		source,
		selector,
	};

	if ( selector === 'range' && range !== null ) {
		(
			action as Extract< AnnotationAction, { type: 'ANNOTATION_ADD' } >
		 ).range = range;
	}

	return action;
}

/**
 * Removes an annotation with a specific ID.
 *
 * @param annotationId The annotation to remove.
 * @return Action object.
 */
export function __experimentalRemoveAnnotation(
	annotationId: string
): AnnotationAction {
	return {
		type: 'ANNOTATION_REMOVE',
		annotationId,
	};
}

/**
 * Updates the range of an annotation.
 *
 * @param annotationId ID of the annotation to update.
 * @param start        The start of the new range.
 * @param end          The end of the new range.
 * @return Action object.
 */
export function __experimentalUpdateAnnotationRange(
	annotationId: string,
	start: number,
	end: number
): AnnotationAction {
	return {
		type: 'ANNOTATION_UPDATE_RANGE',
		annotationId,
		start,
		end,
	};
}

/**
 * Removes all annotations of a specific source.
 *
 * @param source The source to remove.
 * @return Action object.
 */
export function __experimentalRemoveAnnotationsBySource(
	source: string
): AnnotationAction {
	return {
		type: 'ANNOTATION_REMOVE_SOURCE',
		source,
	};
}
