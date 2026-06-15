/**
 * WordPress dependencies
 */
import { createSelector } from '@wordpress/data';

/**
 * Internal dependencies
 */
import type { AnnotationsState, Annotation } from '../types';

/**
 * Shared reference to an empty array for cases where it is important to avoid
 * returning a new array reference on every invocation, as in a connected or
 * other pure component which performs `shouldComponentUpdate` check on props.
 * This should be used as a last resort, since the normalized data should be
 * maintained by the reducer result in state.
 */
const EMPTY_ARRAY: Annotation[] = [];

/**
 * Returns the annotations for a specific client ID.
 *
 * @param state         Editor state.
 * @param blockClientId The ID of the block to get the annotations for.
 * @return The annotations applicable to this block.
 */
export const __experimentalGetAnnotationsForBlock = createSelector(
	( state: AnnotationsState, blockClientId: string ): Annotation[] => {
		return ( state?.[ blockClientId ] ?? [] ).filter( ( annotation ) => {
			return annotation.selector === 'block';
		} );
	},
	( state: AnnotationsState, blockClientId: string ) => [
		state?.[ blockClientId ] ?? EMPTY_ARRAY,
	]
);

export function __experimentalGetAllAnnotationsForBlock(
	state: AnnotationsState,
	blockClientId: string
): Annotation[] {
	return state?.[ blockClientId ] ?? EMPTY_ARRAY;
}

/**
 * Returns the annotations that apply to the given RichText instance.
 *
 * Both a blockClientId and a richTextIdentifier are required. This is because
 * a block might have multiple `RichText` components. This does mean that every
 * block needs to implement annotations itself.
 *
 * @param state              Editor state.
 * @param blockClientId      The client ID for the block.
 * @param richTextIdentifier Unique identifier that identifies the given RichText.
 * @return All the annotations relevant for the `RichText`.
 */
export const __experimentalGetAnnotationsForRichText = createSelector(
	(
		state: AnnotationsState,
		blockClientId: string,
		richTextIdentifier: string
	): Annotation[] => {
		return ( state?.[ blockClientId ] ?? [] )
			.filter( ( annotation ) => {
				return (
					annotation.selector === 'range' &&
					richTextIdentifier === annotation.richTextIdentifier
				);
			} )
			.map( ( annotation ) => {
				const { range, ...other } = annotation;

				return {
					...range,
					...other,
				};
			} );
	},
	( state: AnnotationsState, blockClientId: string ) => [
		state?.[ blockClientId ] ?? EMPTY_ARRAY,
	]
);

/**
 * Returns all annotations in the editor state.
 *
 * @param state Editor state.
 * @return All annotations currently applied.
 */
export function __experimentalGetAnnotations(
	state: AnnotationsState
): Annotation[] {
	return Object.values( state )
		.filter( ( arr ): arr is Annotation[] => Boolean( arr ) )
		.flat();
}
