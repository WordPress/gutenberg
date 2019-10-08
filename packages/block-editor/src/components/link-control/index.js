/**
 * WordPress dependencies
 */
import {
	IconButton,
} from '@wordpress/components';

import { __ } from '@wordpress/i18n';

import {
	useCallback,
	useState,
	Fragment,
} from '@wordpress/element';

function LinkControl() {
	// State
	const [ isOpen, setIsOpen ] = useState( false );

	// Effects
	const openLinkUI = useCallback( () => {
		setIsOpen( true );
	} );

	return (
		<Fragment>
			<IconButton
				icon="insert"
				className="components-toolbar__control"
				label={ __( 'Insert link' ) }
				onClick={ openLinkUI }
			/>

			{ isOpen && (

				<div>Link UI is open</div>

			) }
		</Fragment>
	);
}

export default LinkControl;
