/**
 * WordPress dependencies
 */
import { ToolbarDropdownMenu } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import LevelIcon from './level-icon';

export default function LevelControl( { level, onChange } ) {
	const allControls = [ 1, 2, 3, 4, 5, 6, 0 ].map( ( currentLevel ) => {
		const isActive = currentLevel === level;
		return {
			icon: <LevelIcon level={ currentLevel } isPressed={ isActive } />,
			title:
				currentLevel === 0
					? __( 'Paragraph' )
					: // translators: %s: heading level e.g: "1", "2", "3"
					  sprintf( __( 'Heading %d' ), currentLevel ),
			isActive,
			onClick: () => onChange( currentLevel ),
			role: 'menuitemradio',
		};
	} );
	return (
		<ToolbarDropdownMenu
			label={ __( 'Change heading level' ) }
			icon={ <LevelIcon level={ level } /> }
			controls={ allControls }
		/>
	);
}
