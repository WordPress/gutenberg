/**
 * Client-side binding state for Cover. A URL binding controls the image shown
 * in the editor; an ID binding is optional attachment metadata.
 *
 * @param {Object} options            Hook options.
 * @param {Object} options.attributes The Cover block's attributes (already
 *                                    binding-resolved by the framework).
 * @return {{ bindingActive: boolean, bindingResolvedUrl: (string|undefined) }} Binding state.
 */
export default function useCoverBindingState( { attributes } ) {
	const bindings = attributes.metadata?.bindings;
	const hasUrlBinding = !! bindings?.__default || !! bindings?.url;

	const bindingActive =
		hasUrlBinding && attributes.backgroundType !== 'embed-video';

	return {
		bindingActive,
		bindingResolvedUrl: bindingActive ? attributes.url : undefined,
	};
}
