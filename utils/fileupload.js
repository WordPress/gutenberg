
export function fileUpload( files, setAttributes ) {
	if ( files.length < 1 ) {
		return;
	}

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

export function filesUpload( filesList, setAttributes ) {
	const files = [ ...filesList ];
	if ( files.length < 1 ) {
		return;
	}

	const imgs = [];
	files.forEach( ( media, idx ) => {
		// only allow image uploads
		if ( ! /^image\//.test( media.type ) ) {
			return;
		}

		// set temporary URL to create image placeholder
		const tempUrl = window.URL.createObjectURL( media );
		const img = { url: tempUrl };
		imgs.push( img );
		setAttributes( { images: imgs } );

		// create upload payload
		const data = new window.FormData();
		data.append( 'file', media );

		new wp.api.models.Media().save( null, {
			data: data,
			contentType: false,
		} ).done( ( savedMedia ) => {
			img.id = savedMedia.id;
			img.link = savedMedia.link;
			img.url = savedMedia.source_url;
			setAttributes( { images: [
				...imgs.slice( 0, idx ),
				img,
				...imgs.slice( idx + 1 ),
			] } );
		} ).fail( () => {
			// Reset to empty on failure.
			// TODO: Better failure messaging
			img.url = null;
			setAttributes( { images: [
				...imgs.slice( 0, idx ),
				...imgs.slice( idx + 1 ),
			] } );
		} );
	} );
}
