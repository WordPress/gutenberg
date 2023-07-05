const POST_TYPES_THAT_USE_STRING_BASED_IDS = [
	'wp_template',
	'wp_template_part',
];
export default function normalizePostIdForPostType( postId, postType ) {
	return ! POST_TYPES_THAT_USE_STRING_BASED_IDS?.includes( postType )
		? Number( postId )
		: postId;
}
