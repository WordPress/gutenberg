/**
 * WordPress dependencies
 */
import { ToolbarGroup } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import LevelIcon from './level-icon';

export default function LevelToolbar( { level, onChange } ) {
	return (
		<ToolbarGroup
			isCollapsed
			icon={ <LevelIcon level={ level } /> }
			controls={ [ 1, 2, 3, 4, 5, 6, 0 ].map( ( currentLevel ) => {
				const isActive = currentLevel === level;
				return {
					icon: (
						<LevelIcon
							level={ currentLevel }
							isPressed={ isActive }
						/>
					),
					title:
						currentLevel === 0
							? __( 'Paragraph' )
							: // translators: %s: heading level e.g: "1", "2", "3"
							  sprintf( __( 'Heading %d' ), currentLevel ),
					isActive,
					onClick: () => onChange( currentLevel ),
				};
			} ) }
			label={ __( 'Change heading level' ) }
		/>
	);
}
