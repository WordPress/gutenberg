/**
 * WordPress dependencies
 */

import { Button, SelectControl } from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export default function MenuSelector( { activeMenuId, menus, onSelectMenu } ) {
	const isMobileViewport = useViewportMatch( 'small', '<' );
	const [ selectedMenuId, setSelectedMenuId ] = useState( activeMenuId );

	return (
		<>
			<SelectControl
				label={ __( 'Select menu' ) }
				hideLabelFromVision={ isMobileViewport }
				disabled={ ! menus?.length }
				value={ selectedMenuId ?? 0 }
				options={
					menus?.length
						? menus.map( ( menu ) => ( {
								value: menu.id,
								label: menu.name,
						  } ) )
						: [
								{
									value: 0,
									label: '-',
								},
						  ]
				}
				onChange={ setSelectedMenuId }
			/>
			<Button
				isSecondary
				onClick={ () => onSelectMenu( selectedMenuId ) }
			>
				{ __( 'Change' ) }
			</Button>
		</>
	);
}
