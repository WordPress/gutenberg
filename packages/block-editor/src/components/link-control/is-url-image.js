/**
 * Checks if the url is an image.
 * @param {string} url the url we are checking.
 * @return {boolean} true if the url is an image url.
 */
export default function isImageUrl( url ) {
	const pattern = /(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|gif|png)/g;
	return pattern.test( url );
}
