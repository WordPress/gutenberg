/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { RawHTML } from '@wordpress/element';
import { safeHTML } from '@wordpress/dom';


const BlockView = ( { title, rawContent, renderedContent, action, actionText, className } ) => {
	return (
		<div className={ className }>
			<div className="editor-block-compare__content block-editor-block-compare__content">
				<h2 className="editor-block-compare__heading block-editor-block-compare__heading">{ title }</h2>

				<div className="editor-block-compare__html block-editor-block-compare__html">
					{ rawContent }
				</div>

				<div className="editor-block-compare__preview block-editor-block-compare__preview edit-post-visual-editor">
					<RawHTML>{ safeHTML( renderedContent ) }</RawHTML>
				</div>
			</div>

			<div className="editor-block-compare__action block-editor-block-compare__action">
				<Button isLarge tabIndex="0" onClick={ action }>{ actionText }</Button>
			</div>
		</div>
	);
};

export default BlockView;
