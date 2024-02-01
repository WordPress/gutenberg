/**
 * Checks if the url is an image.
 * @param {string} url the url we are checking.
 * @return {boolean} true if the url is an image url.
 */
export default function isImageUrl( url ) {
	const pattern =
		/^(https?:\/\/)([\w-]+(?:\.[\w-]+)*\/)*[\w-]+\.(?:jpg|JPG|jpeg|gif|png|webp)$/i;
	return pattern.test( url );
}
