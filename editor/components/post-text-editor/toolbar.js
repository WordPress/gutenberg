function PostTextEditorToolbar() {
	return (
		<div className="editor-post-text-editor__toolbar">
			<button className="editor-post-text-editor__bold">b</button>
			<button className="editor-post-text-editor__italic">i</button>
			<button className="editor-post-text-editor__link">link</button>
			<button>b-quote</button>
			<button className="editor-post-text-editor__del">del</button>
			<button>ins</button>
			<button>img</button>
			<button>ul</button>
			<button>ol</button>
			<button>li</button>
			<button>code</button>
			<button>more</button>
			<button>close tags</button>
		</div>
	);
}

export default PostTextEditorToolbar;
