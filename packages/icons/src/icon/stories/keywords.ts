const keywords: Partial< Record< keyof typeof import('../../'), string[] > > = {
	cancelCircleFilled: [ 'close' ],
	caution: [ 'alert', 'warning' ],
	cautionFilled: [ 'alert', 'warning' ],
	create: [ 'add' ],
	error: [ 'alert', 'caution', 'warning' ],
	file: [ 'folder' ],
	seen: [ 'show' ],
	thumbsDown: [ 'dislike' ],
	thumbsUp: [ 'like' ],
	trash: [ 'delete' ],
	unseen: [ 'hide' ],
};

export default keywords;
