/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const CreateNewMenuButton = ( { onCreateNew } ) => {
	const [ isCreatingMenu, setIsCreatingMenu ] = useState( false );

	return (
		<Button
			className="wp-block-navigation__navigation-selector-button--createnew"
			isBusy={ isCreatingMenu }
			disabled={ isCreatingMenu }
			__experimentalIsFocusable
			onClick={ () => {
				onCreateNew();
				setIsCreatingMenu( true );
			} }
		>
			{ isCreatingMenu ? __( 'Loading…' ) : __( 'Create new menu' ) }
		</Button>
	);
};

export default CreateNewMenuButton;
