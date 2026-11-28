export interface LatestCommentsAttributes extends Record< string, unknown > {
	commentsToShow?: number;
	displayAvatar?: boolean;
	displayDate?: boolean;
	displayContent?: 'none' | 'excerpt' | 'full';
}

export interface LatestCommentsDeprecatedAttributes extends LatestCommentsAttributes {
	displayExcerpt?: boolean;
}
