const keywords: Partial< Record< keyof typeof import('../../'), string[] > > = {
	archive: [ 'folder' ],
	atSymbol: [ 'email' ],
	audio: [ 'music' ],
	cancelCircleFilled: [ 'close' ],
	caution: [ 'alert', 'warning' ],
	cautionFilled: [ 'alert', 'warning' ],
	create: [ 'add', 'new', 'plus' ],
	envelope: [ 'email' ],
	error: [ 'alert', 'caution', 'warning' ],
	file: [ 'folder' ],
	lifesaver: [ 'buoy' ],
	seen: [ 'show', 'visible', 'eye' ],
	starFilled: [ 'favorite' ],
	pencil: [ 'edit' ],
	thumbsDown: [ 'dislike' ],
	thumbsUp: [ 'like' ],
	timeToRead: [ 'clock' ],
	trash: [ 'delete' ],
	unseen: [ 'hide' ],
};

export default keywords;
