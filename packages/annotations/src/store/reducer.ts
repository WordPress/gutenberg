/**
 * Internal dependencies
 */
import type {
	AnnotationAction,
	AnnotationsState,
	Annotation,
	AnnotationRange,
} from '../types';

/**
 * Filters an array based on the predicate, but keeps the reference the same if
 * the array hasn't changed.
 *
 * @param collection The collection to filter.
 * @param predicate  Function that determines if the item should stay
 *                   in the array.
 * @return Filtered array.
 */
function filterWithReference< T >(
	collection: T[],
	predicate: ( item: T ) => boolean
): T[] {
	const filteredCollection = collection.filter( predicate );

	return collection.length === filteredCollection.length
		? collection
		: filteredCollection;
}

/**
 * Creates a new object with the same keys, but with `callback()` called as
 * a transformer function on each of the values.
 *
 * @param obj      The object to transform.
 * @param callback The function to transform each object value.
 * @return Transformed object.
 */
const mapValues = < T, U >(
	obj: Partial< Record< string, T > >,
	callback: ( value: T ) => U
): Partial< Record< string, U > > =>
	Object.entries( obj ).reduce( ( acc, [ key, value ] ) => {
		if ( value === undefined ) {
			return acc;
		}
		return {
			...acc,
			[ key ]: callback( value ),
		};
	}, {} );

/**
 * Verifies whether the given annotations is a valid annotation.
 *
 * @param annotation       The annotation to verify.
 * @param annotation.range The range property of the annotation.
 * @return Whether the given annotation is valid.
 */
function isValidAnnotationRange( annotation: {
	range?: AnnotationRange | null;
} ): boolean {
	return Boolean(
		annotation.range &&
			typeof annotation.range.start === 'number' &&
			typeof annotation.range.end === 'number' &&
			annotation.range.start <= annotation.range.end
	);
}

/**
 * Reducer managing annotations.
 *
 * @param state  The annotations currently shown in the editor.
 * @param action Dispatched action.
 * @return Updated state.
 */
export function annotations(
	state: AnnotationsState = {},
	action: AnnotationAction
): AnnotationsState {
	switch ( action.type ) {
		case 'ANNOTATION_ADD':
			const blockClientId = action.blockClientId;
			const newAnnotation: Annotation = {
				id: action.id,
				blockClientId,
				richTextIdentifier: action.richTextIdentifier,
				source: action.source,
				selector: action.selector,
				range: action.range,
			};

			if (
				newAnnotation.selector === 'range' &&
				! isValidAnnotationRange( newAnnotation )
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
			return mapValues( state, ( annotationsForBlock: Annotation[] ) => {
				return filterWithReference(
					annotationsForBlock,
					( annotation: Annotation ) => {
						return annotation.id !== action.annotationId;
					}
				);
			} );

		case 'ANNOTATION_UPDATE_RANGE':
			return mapValues( state, ( annotationsForBlock: Annotation[] ) => {
				let hasChangedRange = false;

				const newAnnotations = annotationsForBlock.map(
					( annotation: Annotation ) => {
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
			return mapValues( state, ( annotationsForBlock: Annotation[] ) => {
				return filterWithReference(
					annotationsForBlock,
					( annotation: Annotation ) => {
						return annotation.source !== action.source;
					}
				);
			} );
	}

	return state;
}

export default annotations;
