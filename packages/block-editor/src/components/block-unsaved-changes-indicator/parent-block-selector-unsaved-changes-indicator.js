/**
 * WordPress dependencies
 */
import { Fill } from '@wordpress/components';
import { useEffect } from '@wordpress/element';

function UnsavedChangesIndicator() {
	useEffect( () => {
		// add class to the parent selector to increase it's width
		const parentSelectorBtn = document.querySelector(
			'.block-editor-block-parent-selector'
		);
		parentSelectorBtn.classList.add( 'parent-block-has-changes' );
		// add class to the contextual toolbar to move it to the right side
		const contextualToolBar = document.querySelector(
			'.block-editor-block-contextual-toolbar'
		);
		contextualToolBar.classList.add( 'parent-block-has-changes' );

		return () => {
			// remove classes from the parent selector and contextual toolbar when component unmounts
			document
				.querySelector( '.block-editor-block-parent-selector' )
				.classList.remove( 'parent-block-has-changes' );
			document
				.querySelector( '.block-editor-block-contextual-toolbar' )
				.classList.remove( 'parent-block-has-changes' );
		};
	}, [] );

	return (
		<div className="parent-block-selector-unsaved-changes-indicator"></div>
	);
}

function ParentBlockSelectorUnsavedChangesIndicator() {
	return (
		<>
			<Fill name="parent-block-selector-unsaved-changes-indicator">
				<UnsavedChangesIndicator />
			</Fill>
		</>
	);
}

export default ParentBlockSelectorUnsavedChangesIndicator;
