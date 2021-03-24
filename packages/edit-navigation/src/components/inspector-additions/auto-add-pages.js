/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';
import { PanelBody, CheckboxControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function AutoAddPages( { menuId } ) {
	const menu = useSelect( ( select ) => select( 'core' ).getMenu( menuId ), [
		menuId,
	] );

	const [ autoAddPages, setAutoAddPages ] = useState( null );

	useEffect( () => {
		if ( autoAddPages === null && menu ) {
			setAutoAddPages( menu.auto_add );
		}
	}, [ autoAddPages, menu ] );

	const { saveMenu } = useDispatch( 'core' );

	return (
		<PanelBody>
			<CheckboxControl
				label={ __( 'Automatically add new top-level pages' ) }
				checked={ autoAddPages ?? false }
				onChange={ ( newAutoAddPages ) => {
					setAutoAddPages( newAutoAddPages );
					saveMenu( {
						...menu,
						auto_add: newAutoAddPages,
					} );
				} }
			/>
		</PanelBody>
	);
}
