export default function removePageFromBlockContext( context ) {
	return {
		...context,
		postType: null,
		postId: null,
	};
}
