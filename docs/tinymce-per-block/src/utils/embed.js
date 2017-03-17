export const getEmbedHtmlFromUrl = ( url, align ) => {
	const getYoutubeId = ( youtubeUrl ) => {
		const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
		const match = youtubeUrl.match( regExp );

		if ( match && match[ 2 ].length === 11 ) {
			return match[ 2 ];
		}

		return false;
	};

	const youtubeId = getYoutubeId( url );
	const style = align === 'align-full-width'
		? 'style="width: 100vw; min-height: 50vw;"'
		: 'width="560" height="315"';

	return youtubeId
		? `<iframe ${ style } src="//www.youtube.com/embed/${ youtubeId }" frameborder="0" allowfullscreen></iframe>`
		: '';
};
