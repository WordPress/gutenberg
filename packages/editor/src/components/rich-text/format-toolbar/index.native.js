/**
 * WordPress dependencies
 */
import { Toolbar } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { FORMATTING_CONTROLS } from '../formatting-controls';
import ToolbarContainer from './toolbar-container';

export default function FormatToolbar( {
	onChange,
	formats,
	enabledControls = [],
} ) {
	const toolbarControls = FORMATTING_CONTROLS
		.filter( ( control ) => enabledControls.indexOf( control.format ) !== -1 )
		.map( ( control ) => {
			return {
				...control,
				onClick: () => onChange( {
					[ control.format ]: ! formats[ control.format ],
				} ),
				isActive: formats[ control.format ] && formats[ control.format ].isActive,
			};
		} );

	return (
		<ToolbarContainer>
			<Toolbar controls={ toolbarControls } />
		</ToolbarContainer>
	);
}
