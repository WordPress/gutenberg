/**
 * External dependencies
 */

import { orderBy } from 'lodash';

/**
 * WordPress dependencies
 */

import { __ } from '@wordpress/i18n';
import { Toolbar, Slot, DropdownMenu } from '@wordpress/components';

/**
 * Internal dependencies
 */

import NavigableToolbar from '../../navigable-toolbar';

const FormatToolbar = ( { controls } ) => {
	return (
		<NavigableToolbar
			scopeId="block-editor-format-toolbar"
			className="editor-format-toolbar"
		>
			<Toolbar>
				{ controls.map( ( format ) =>
					<Slot name={ `RichText.ToolbarControls.${ format }` } key={ format } />
				) }
				<Slot name="RichText.ToolbarControls">
					{ ( fills ) => fills.length &&
						<DropdownMenu
							icon={ false }
							position="bottom left"
							label={ __( 'More Rich Text Controls' ) }
							controls={ orderBy( fills.map( ( [ { props } ] ) => props ), 'title' ) }
						/>
					}
				</Slot>
			</Toolbar>
		</NavigableToolbar>
	);
};

export default FormatToolbar;
