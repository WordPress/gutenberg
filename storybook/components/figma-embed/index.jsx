/**
 * Internal dependencies
 */
import './style.scss';

// See https://www.figma.com/developers/embed#embed-a-figma-file
const CONFIG = {
	'embed-host': 'wordpress-storybook',
	footer: false,
	'page-selector': false,
	'viewport-controls': true,
};

/**
 * Embed Figma links in the Storybook.
 *
 * @param {Object} props
 * @param {string} props.url   - Figma URL to embed.
 * @param {string} props.title - Accessible title for the iframe.
 */
function FigmaEmbed( { url, title, ...props } ) {
	const urlObj = new URL( url );

	const queryParams = new URLSearchParams( urlObj.search );
	Object.entries( CONFIG ).forEach( ( [ key, value ] ) => {
		queryParams.set( key, value );
	} );
	urlObj.search = queryParams.toString();

	urlObj.hostname = urlObj.hostname.replace(
		'www.figma.com',
		'embed.figma.com'
	);

	const normalizedUrl = urlObj.toString();

	return (
		<iframe
			title={ title }
			src={ normalizedUrl }
			className="wp-storybook-figma-embed"
			{ ...props }
		/>
	);
}

export default FigmaEmbed;
