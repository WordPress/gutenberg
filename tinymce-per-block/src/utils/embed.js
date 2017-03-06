export const getEmbedHtmlFromUrl = ( url ) => {
	const getYoutubeId = ( youtubeUrl ) => {
		const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
		const match = youtubeUrl.match( regExp );

		if ( match && match[ 2 ].length === 11 ) {
			return match[ 2 ];
		}

		return false;
	};

	const youtubeId = getYoutubeId( url );
	return youtubeId
		? '<iframe width="560" height="315" src="//www.youtube.com/embed/' +
			youtubeId + '" frameborder="0" allowfullscreen></iframe>'
		: '';
};
