import { isNumber, mapValues } from 'lodash';

/**
 * Filters an array based on the predicate, but keeps the reference the same if
 * the array hasn't changed.
 *
 * @param {Array}    collection The collection to filter.
 * @param {Function} predicate  Function that determines if the item should stay
 *                              in the array.
 * @return {Array} Filtered array.
 */
function filterWithReference( collection, predicate ) {
	const filteredCollection = collection.filter( predicate );

	return collection.length === filteredCollection.length ? collection : filteredCollection;
}

/**
 * Verifies whether the given annotations is a valid annotation.
 *
 * @param {Object} annotation The annotation to verify.
 * @return {boolean} Whether the given annotation is valid.
 */
function isValidAnnotationRange( annotation ) {
	return isNumber( annotation.start ) &&
		isNumber( annotation.end ) &&
		annotation.start <= annotation.end;
}

/**
 * Reducer managing annotations.
 *
 * @param {Array} state The annotations currently shown in the editor.
 * @param {Object} action Dispatched action.
 *
 * @return {Array} Updated state.
 */
export function annotations( state = { all: [], byBlockClientId: {} }, action ) {
	switch ( action.type ) {
		case 'ANNOTATION_ADD':
			const blockClientId = action.blockClientId;
			const newAnnotation = {
				id: action.id,
				blockClientId,
				richTextIdentifier: action.richTextIdentifier,
				source: action.source,
				selector: action.selector,
				range: action.range,
			};

			if ( newAnnotation.selector === 'range' && ! isValidAnnotationRange( newAnnotation.range ) ) {
				return state;
			}

			const previousAnnotationsForBlock = state.byBlockClientId[ blockClientId ] || [];

			return {
				all: [
					...state.all,
					newAnnotation,
				],
				byBlockClientId: {
					...state.byBlockClientId,
					[ blockClientId ]: [ ...previousAnnotationsForBlock, action.id ],
				},
			};

		case 'ANNOTATION_REMOVE':
			return {
				all: state.all.filter( ( annotation ) => annotation.id !== action.annotationId ),

				// We use filterWithReference to not refresh the reference if a block still has
				// the same annotations.
				byBlockClientId: mapValues( state.byBlockClientId, ( annotationForBlock ) => {
					return filterWithReference( annotationForBlock, ( annotationId ) => {
						return annotationId !== action.annotationId;
					} );
				} ),
			};

		case 'ANNOTATION_REMOVE_SOURCE':
			const idsToRemove = [];

			const allAnnotations = state.all.filter( ( annotation ) => {
				if ( annotation.source === action.source ) {
					idsToRemove.push( annotation.id );
					return false;
				}

				return true;
			} );

			return {
				all: allAnnotations,
				byBlockClientId: mapValues( state.byBlockClientId, ( annotationForBlock ) => {
					return filterWithReference( annotationForBlock, ( annotationId ) => {
						return ! idsToRemove.includes( annotationId );
					} );
				} ),
			};
	}

	return state;
}

export default annotations;
