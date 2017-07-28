import Textarea from 'react-autosize-textarea';

/**
 * Internal dependencies
 */
import './style.scss';
import PostTitle from '../../post-title';

function TextEditor( { value, onChange } ) {
	return (
		<div className="editor-text-editor">
			<header className="editor-text-editor__formatting">
				<div className="editor-text-editor__formatting-group">
					<button className="editor-text-editor__bold">b</button>
					<button className="editor-text-editor__italic">i</button>
					<button className="editor-text-editor__link">link</button>
					<button>b-quote</button>
					<button className="editor-text-editor__del">del</button>
					<button>ins</button>
					<button>img</button>
					<button>ul</button>
					<button>ol</button>
					<button>li</button>
					<button>code</button>
					<button>more</button>
					<button>close tags</button>
				</div>
			</header>
			<div className="editor-text-editor__body">
				<PostTitle />
				<Textarea
					autoComplete="off"
					value={ value }
					onChange={ ( event ) => onChange( event.target.value ) }
					className="editor-text-editor__textarea"
				/>
			</div>
		</div>
	);
}

export default TextEditor;
