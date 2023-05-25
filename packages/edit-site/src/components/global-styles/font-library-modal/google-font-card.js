/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { plus, reset } from '@wordpress/icons';
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { FontLibraryContext } from './context';
import FontCard from './font-card';

function GoogleFontCard( { font, onClick, toggleAddFont, isFontAdded } ) {
	const {} = useContext( FontLibraryContext );

	const handleClick = ( event, font ) => {
		event.stopPropagation();
		toggleAddFont( font );
	};

	const isAdded = isFontAdded( font );

	return (
		<FontCard
			elevation={ isAdded ? 1 : 0 }
			font={ font }
			onClick={ () => onClick( font ) }
			actionHandler={
				<Button
					icon={ isAdded ? reset : plus }
					onClick={ ( event ) => {
						handleClick( event, font );
					} }
				>
					{ isAdded ? __( 'Remove' ) : __( 'Select' ) }
				</Button>
				// <CheckboxControl
				//     onChange={ () => {} }
				//     checked={ isAdded }
				//     onClick={ ( event ) =>
				//         handleClick( event, font )
				//     }
				// />
			}
		/>
	);
}

export default GoogleFontCard;
