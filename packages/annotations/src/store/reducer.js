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

	return collection.length === filteredCollection.length
		? collection
		: filteredCollection;
}

/**
 * Creates a new object with the same keys, but with `callback()` called as
 * a transformer function on each of the values.
 *
 * @param {Object}   obj      The object to transform.
 * @param {Function} callback The function to transform each object value.
 * @return {Array} Transformed object.
 */
const mapValues = ( obj, callback ) =>
	Object.entries( obj ).reduce(
		( acc, [ key, value ] ) => ( {
			...acc,
			[ key ]: callback( value ),
		} ),
		{}
	);

/**
 * Verifies whether the given annotations is a valid annotation.
 *
 * @param {Object} annotation The annotation to verify.
 * @return {boolean} Whether the given annotation is valid.
 */
function isValidAnnotationRange( annotation ) {
	return (
		typeof annotation.start === 'number' &&
		typeof annotation.end === 'number' &&
		annotation.start <= annotation.end
	);
}

/**
 * Reducer managing annotations.
 *
 * @param {Object} state  The annotations currently shown in the editor.
 * @param {Object} action Dispatched action.
 *
 * @return {Array} Updated state.
 */
export function annotations( state = {}, action ) {
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

			if (
				newAnnotation.selector === 'range' &&
				! isValidAnnotationRange( newAnnotation.range )
			) {
				return state;
			}

			const previousAnnotationsForBlock = state?.[ blockClientId ] ?? [];

			return {
				...state,
				[ blockClientId ]: [
					...previousAnnotationsForBlock,
					newAnnotation,
				],
			};

		case 'ANNOTATION_REMOVE':
			return mapValues( state, ( annotationsForBlock ) => {
				return filterWithReference(
					annotationsForBlock,
					( annotation ) => {
						return annotation.id !== action.annotationId;
					}
				);
			} );

		case 'ANNOTATION_UPDATE_RANGE':
			return mapValues( state, ( annotationsForBlock ) => {
				let hasChangedRange = false;

				const newAnnotations = annotationsForBlock.map(
					( annotation ) => {
						if ( annotation.id === action.annotationId ) {
							hasChangedRange = true;
							return {
								...annotation,
								range: {
									start: action.start,
									end: action.end,
								},
							};
						}

						return annotation;
					}
				);

				return hasChangedRange ? newAnnotations : annotationsForBlock;
			} );

		case 'ANNOTATION_REMOVE_SOURCE':
			return mapValues( state, ( annotationsForBlock ) => {
				return filterWithReference(
					annotationsForBlock,
					( annotation ) => {
						return annotation.source !== action.source;
					}
				);
			} );
	}

	return state;
}

export default annotations;
