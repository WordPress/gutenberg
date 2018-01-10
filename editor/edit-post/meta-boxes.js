/**
 * Function returning the current Meta Boxes HTML in the editor
 * whether the meta box area is opened or not.
 * This is not so clear, but I believe it's the only way to have this data synchronously
 *
 * @param   {String} location Meta Box location
 * @returns {String}          HTML content
 */
export const getLocationHtml = ( location ) => {
	const area = document.querySelector( `.editor-meta-boxes-area.is-${ location } .editor-meta-boxes-area__container` );
	if ( area ) {
		return area.innerHTML;
	}

	return document.querySelector( '.metabox-location-' + location ).innerHTML;
};
