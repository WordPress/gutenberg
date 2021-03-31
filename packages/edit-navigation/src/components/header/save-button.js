/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { useContext } from '@wordpress/element';
import { Button, Tooltip } from '@wordpress/components';
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
		<span className="dot" />
		{ saveText }
	</>
);

export default function SaveButton( { navigationPost } ) {
	const { saveNavigationPost } = useDispatch( editNavigationStore );
	const [ unsavedElements ] = useContext( UnsavedElementsContext );
	const isDisabled = isEmpty( unsavedElements );
	const buttonText = isDisabled ? saveText : withUnsavedIndicator;
	const button = (
		<Button
			isPrimary
			className="edit-navigation-toolbar__save-button"
			onClick={ () => {
				saveNavigationPost( navigationPost );
			} }
			disabled={ ! navigationPost || isDisabled }
		>
			{ buttonText }
		</Button>
	);

	return isDisabled ? (
		<Tooltip text={ __( 'No changes to save' ) }>{ button }</Tooltip>
	) : (
		button
	);
}
