export default function removePageFromBlockContext( context ) {
	if ( context ) {
		const { postType, postId, ...rest } = context;
		return rest;
	}
	return context;
}
