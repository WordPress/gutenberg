/**
 * External dependencies
 */
import classnames from 'classnames';

function EditorRegions( { footer, header, sidebar, content, className } ) {
	return (
		<div className={ classnames( className, 'edit-post-editor-regions' ) }>
			{ !! header && (
				<div className="edit-post-editor-regions__header">
					{ header }
				</div>
			) }
			<div className="edit-post-editor-regions__body">
				<div className="edit-post-editor-regions__content">{ content }</div>
				{ !! sidebar && (
					<div className="edit-post-editor-regions__sidebar">
						{ sidebar }
					</div>
				) }
			</div>
			{ !! footer && (
				<div className="edit-post-editor-regions__footer">
					{ footer }
				</div>
			) }
		</div>
	);
}

export default EditorRegions;
