/**
 * External dependencies
 */
import uuid from 'uuid/v4';

/**
 * Adds an annotation to a block.
 *
 * The `block` attribute refers to a block ID that needs to be annotated.
 * `isBlockAnnotation` controls whether or not the annotation is a block
 * annotation. The `source` is the source of the annotation, this will be used
 * to identity groups of annotations.
 *
 * The `range` property is only relevant if the selector is 'range'.
 *
 * @param {Object} annotation                    The annotation to add.
 * @param {string} annotation.blockClientId      The blockClientId to add the annotation to.
 * @param {string} annotation.richTextIdentifier Identifier for the RichText instance the annotation applies to.
 * @param {Object} annotation.range              The range at which to apply this annotation.
 * @param {number} annotation.range.start        The offset where the annotation should start.
 * @param {number} annotation.range.end          The offset where the annotation should end.
 * @param {string} annotation.[selector="range"] The way to apply this annotation.
 * @param {string} annotation.[source="default"] The source that added the annotation.
 * @param {string} annotation.[id]               The ID the annotation should have. Generates a UUID by default.
 *
 * @return {Object} Action object.
 */
export function __experimentalAddAnnotation( {
	blockClientId,
	richTextIdentifier = null,
	range = null,
	selector = 'range',
	source = 'default',
	id = uuid(),
} ) {
	const action = {
		type: 'ANNOTATION_ADD',
		id,
		blockClientId,
		richTextIdentifier,
		source,
		selector,
	};

	if ( selector === 'range' ) {
		action.range = range;
	}

	return action;
}

/**
 * Removes an annotation with a specific ID.
 *
 * @param {string} annotationId The annotation to remove.
 *
 * @return {Object} Action object.
 */
export function __experimentalRemoveAnnotation( annotationId ) {
	return {
		type: 'ANNOTATION_REMOVE',
		annotationId,
	};
}

/**
 * Updates the range of an annotation.
 *
 * @param {string} annotationId ID of the annotation to update.
 * @param {number} start The start of the new range.
 * @param {number} end The end of the new range.
 *
 * @return {Object} Action object.
 */
export function __experimentalUpdateAnnotationRange(
	annotationId,
	start,
	end
) {
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
 * @param {string} source The source to remove.
 *
 * @return {Object} Action object.
 */
export function __experimentalRemoveAnnotationsBySource( source ) {
	return {
		type: 'ANNOTATION_REMOVE_SOURCE',
		source,
	};
}
