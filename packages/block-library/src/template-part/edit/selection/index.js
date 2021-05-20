/**
 * WordPress dependencies
 */
import { __experimentalSearchForm as SearchForm } from '@wordpress/block-editor';
import { useState } from '@wordpress/element';
import { LEFT, RIGHT, UP, DOWN, BACKSPACE, ENTER } from '@wordpress/keycodes';
/**
 * Internal dependencies
 */
import TemplatePartPreviews from './template-part-previews';

const preventArrowKeysPropagation = ( event ) => {
	if (
		[ LEFT, DOWN, RIGHT, UP, BACKSPACE, ENTER ].includes( event.keyCode )
	) {
		// Stop the key event from propagating up to ObserveTyping.startTypingInTextField.
		event.stopPropagation();
	}
};
const stopKeyPropagation = ( event ) => event.stopPropagation();

// Disable reason (no-static-element-interactions): Navigational key-presses within
// the menu are prevented from triggering WritingFlow and ObserveTyping interactions.
/* eslint-disable jsx-a11y/no-static-element-interactions */
export default function TemplatePartSelection( {
	setAttributes,
	onClose,
	area,
	templatePartId = null,
} ) {
	const [ filterValue, setFilterValue ] = useState( '' );
	return (
		<div
			onKeyPress={ stopKeyPropagation }
			onKeyDown={ preventArrowKeysPropagation }
		>
			<SearchForm
				value={ filterValue }
				onChange={ setFilterValue }
				className="wp-block-template-part__selection-preview-search-form"
			/>
			<div className="wp-block-template-part__selection-preview-container">
				<TemplatePartPreviews
					setAttributes={ setAttributes }
					filterValue={ filterValue }
					onClose={ onClose }
					area={ area }
					templatePartId={ templatePartId }
				/>
			</div>
		</div>
	);
}
/* eslint-enable jsx-a11y/no-static-element-interactions */
