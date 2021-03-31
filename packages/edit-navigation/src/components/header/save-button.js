/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { useContext } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */

import { UnsavedElementsContext } from '../../hooks';

/**
 * External dependencies
 */
import { isEmpty } from 'lodash';

import { store as editNavigationStore } from '../../store';
const saveText = __( 'Save' );
const withUnsavedIndicator = (
	<>
		<span className="edit-navigation-toolbar__save-button__dot-indicator">
			○
		</span>
		{ saveText }
	</>
);

export default function SaveButton( { navigationPost } ) {
	const { saveNavigationPost } = useDispatch( editNavigationStore );
	const [ unsavedElements ] = useContext( UnsavedElementsContext );
	const isDisabled = isEmpty( unsavedElements );
	const buttonText = isDisabled ? saveText : withUnsavedIndicator;

	return (
		<Button
			className="edit-navigation-toolbar__save-button"
			isPrimary={ ! isDisabled }
			onClick={ () => {
				saveNavigationPost( navigationPost );
			} }
			disabled={ ! navigationPost || isDisabled }
		>
			{ buttonText }
		</Button>
	);
}
