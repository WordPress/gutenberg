export default function createBlockSelectorEngine() {
	// Util functions need to be defined in the `createBlockSelectorEngine`
	// body. Playwright converts this function to a string, and won't be able
	// to reach functions that are defined outside the body.
	function parsePlaywrightSelector( selector ) {
		if ( ! selector ) {
			return {};
		}

		const [ , name ] = selector.match( /^([a-z0-9\/\-]+)/ ) ?? [];
		const [ , title ] = selector.match( /title="(.+?)"/ ) ?? [];
		const [ , clientId ] =
			selector.match( /clientId="([0-9a-f\-]+?)"/ ) ?? [];
		const [ , tag ] = selector.match( /tag="(.+?)"/ ) ?? [];

		return {
			name: name !== '*' ? name : undefined,
			title,
			clientId,
			tag,
		};
	}

	function assembleDOMSelector( { clientId, name, tag, title } ) {
		// Always include a `data-block` attribute selector even if there's no
		// clientId to select. This ensures the selector only returns blocks.
		const clientIdPart = clientId
			? `[data-block="${ clientId }"]`
			: '[data-block]';
		const namePart = name ? `[data-type="${ name }"]` : undefined;
		const tagPart = tag ?? '*';
		const titlePart = title ? `[data-title="${ title }"]` : undefined;

		const attributeParts = [ clientIdPart, namePart, titlePart ]
			.filter( ( part ) => !! part )
			.join( '' );

		return `${ tagPart }${ attributeParts }`;
	}

	return {
		// Returns the first element matching given selector in the root's subtree.
		query( root, selector ) {
			const selectorParams = parsePlaywrightSelector( selector );
			const DOMSelector = assembleDOMSelector( selectorParams );
			return root.querySelector( DOMSelector );
		},

		// Returns all elements matching given selector in the root's subtree.
		queryAll( root, selector ) {
			const selectorParams = parsePlaywrightSelector( selector );
			const DOMSelector = assembleDOMSelector( selectorParams );
			return Array.from( root.querySelectorAll( DOMSelector ) );
		},
		parsePlaywrightSelector,
		assembleDOMSelector,
	};
}
