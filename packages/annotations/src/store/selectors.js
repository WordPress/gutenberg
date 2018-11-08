import createSelector from 'rememo';

/**
 * Returns the annotations for a specific client ID.
 *
 * @param {Object} state Editor state.
 * @param {string} clientId The ID of the block to get the annotations for.
 *
 * @return {Array} The annotations applicable to this block.
 */
export const __experimentalGetAnnotationsForBlock = createSelector(
	( state, blockClientId ) => {
		return state.all.filter( ( annotation ) => {
			return annotation.selector === 'block' && annotation.blockClientId === blockClientId;
		} );
	},
	( state, blockClientId ) => [
		state.byBlockClientId[ blockClientId ],
	]
);

/**
 * Returns the annotations that apply to the given RichText instance.
 *
 * Both a blockClientId and a richTextIdentifier are required. This is because
 * a block might have multiple `RichText` components. This does mean that every
 * block needs to implement annotations itself.
 *
 * @param {Object} state              Editor state.
 * @param {string} blockClientId      The client ID for the block.
 * @param {string} richTextIdentifier Unique identifier that identifies the given RichText.
 * @return {Array} All the annotations relevant for the `RichText`.
 */
export const __experimentalGetAnnotationsForRichText = createSelector(
	( state, blockClientId, richTextIdentifier ) => {
		return state.all.filter( ( annotation ) => {
			return annotation.selector === 'range' &&
				annotation.blockClientId === blockClientId &&
				richTextIdentifier === annotation.richTextIdentifier;
		} ).map( ( annotation ) => {
			const { range, ...other } = annotation;

			return {
				...range,
				...other,
			};
		} );
	},
	( state, blockClientId ) => [
		state.byBlockClientId[ blockClientId ],
	]
);

/**
 * Returns all annotations in the editor state.
 *
 * @param {Object} state Editor state.
 * @return {Array} All annotations currently applied.
 */
export function __experimentalGetAnnotations( state ) {
	return state.all;
}
