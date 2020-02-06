/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

import { Panel, PanelBody, RangeControl } from '@wordpress/components';

export default function GlobalStyles() {
	// Default values
	const fontSize = 16;
	const fontScale = 1.2;
	const lineHeight = 1.5;

	// const textColor = '#000000';
	// const backgroundColor = '#ffffff';
	// const primaryColor = '#0000ff';

	return (
		<Panel header={ __( 'Global Styles' ) }>
			<PanelBody title={ __( 'Typography' ) }>
				<RangeControl
					label="Font Size"
					value={ fontSize }
					min={ 10 }
					max={ 30 }
					step={ 1 }
				/>
				<RangeControl
					label="Font Scale"
					value={ fontScale }
					min={ 1.1 }
					max={ 1.4 }
					step={ 0.025 }
				/>
				<RangeControl
					label="Line Height"
					value={ lineHeight }
					min={ 1 }
					max={ 2 }
					step={ 0.1 }
				/>
			</PanelBody>
			<PanelBody title={ __( 'Colors' ) }></PanelBody>
		</Panel>
	);
}
