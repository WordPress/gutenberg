/**
 * WordPress dependencies
 */
/**
 * Internal dependencies
 */
import { useState } from '@wordpress/element';
import { NameEditor } from '../components/name-editor';
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import NameDisplay from '../components/name-display';

const addMenuNameEditor = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const [ isMenuNameEditFocused, setIsMenuNameEditFocused ] = useState(
			false
		);
		if ( props.name !== 'core/navigation' ) {
			return <BlockEdit { ...props } />;
		}
		return (
			<>
				<BlockEdit { ...props } />
				<NameDisplay
					setIsMenuNameEditFocused={ setIsMenuNameEditFocused }
				/>
				<NameEditor
					{ ...props }
					setIsMenuNameEditFocused={ setIsMenuNameEditFocused }
					isMenuNameEditFocused={ isMenuNameEditFocused }
				/>
			</>
		);
	},
	'withMenuName'
);

export default () =>
	addFilter(
		'editor.BlockEdit',
		'core/edit-navigation/with-menu-name',
		addMenuNameEditor
	);
