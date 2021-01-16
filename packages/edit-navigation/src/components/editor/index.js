/**
 * Internal dependencies
 */
import BlockView from './block-view';
import ListView from './list-view';
/**
 * WordPress dependencies
 */

const sKeyCode = 83;
const checkIsSaveKeyShortcut = ( event ) =>
	( event.key === sKeyCode || event.keyCode === sKeyCode ) &&
	( event.metaKey || event.ctrlKey );
const onSaveKeyShortcut = ( f ) => ( event ) => {
	if ( ! checkIsSaveKeyShortcut( event ) ) return;
	event.preventDefault();
	f();
};

export default function Editor( { isPending, blocks, onSavePost } ) {
	return (
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<div
			className="edit-navigation-editor"
			onKeyDown={ onSaveKeyShortcut( onSavePost ) }
		>
			<BlockView isPending={ isPending } />
			<ListView isPending={ isPending } blocks={ blocks } />
		</div>
	);
}
