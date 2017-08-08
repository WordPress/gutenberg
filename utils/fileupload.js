
export default function fileUpload( files, setAttributes ) {
	const media = files[ 0 ];

	// Only allow image uploads
	if ( ! /^image\//.test( media.type ) ) {
		return;
	}

	// Use File API to assign temporary URL from upload
	setAttributes( {
		url: window.URL.createObjectURL( media ),
	} );

	// Create upload payload
	const data = new window.FormData();
	data.append( 'file', media );

	new wp.api.models.Media().save( null, {
		data: data,
		contentType: false,
	} ).done( ( savedMedia ) => {
		setAttributes( {
			id: savedMedia.id,
			url: savedMedia.source_url,
		} );
	} ).fail( () => {
		// Reset to empty on failure.
		// TODO: Better failure messaging
		setAttributes( { url: null } );
	} );
}
