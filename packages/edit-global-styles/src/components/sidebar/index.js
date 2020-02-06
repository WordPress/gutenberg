/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { Panel, PanelBody, RangeControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

function Sidebar() {
	const [ fontSize, setFontSize ] = useState( 16 );
	return (
		<div
			className="edit-global-styles-sidebar"
			role="region"
			aria-label={ __( 'Global Styles Sidebar' ) }
			tabIndex="-1"
		>
			<Panel header={ __( 'Global Styles' ) }>
				<PanelBody title={ __( 'Typography' ) }>
					<RangeControl
						label={ __( 'Font Size' ) }
						value={ fontSize }
						min={ 10 }
						max={ 30 }
						step={ 1 }
						onChange={ setFontSize }
					/>
				</PanelBody>
			</Panel>
		</div>
	);
}

export default Sidebar;
