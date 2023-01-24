/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalColorGradientControl as ColorGradientControl,
	experiments as blockEditorExperiments,
} from '@wordpress/block-editor';
import { TabPanel } from '@wordpress/components';

/**
 * Internal dependencies
 */
import ScreenHeader from './header';
import { getSupportedGlobalStylesPanels, useColorsPerOrigin } from './hooks';
import { unlock } from '../../experiments';

const { useGlobalSetting, useGlobalStyle } = unlock( blockEditorExperiments );

function ScreenLinkColor( { name, variationPath = '' } ) {
	const supports = getSupportedGlobalStylesPanels( name );
	const [ solids ] = useGlobalSetting( 'color.palette', name );
	const [ areCustomSolidsEnabled ] = useGlobalSetting( 'color.custom', name );

	const colorsPerOrigin = useColorsPerOrigin( name );

	const [ isLinkEnabled ] = useGlobalSetting( 'color.link', name );

	const hasLinkColor =
		supports.includes( 'linkColor' ) &&
		isLinkEnabled &&
		( solids.length > 0 || areCustomSolidsEnabled );

	const pseudoStates = {
		default: {
			label: __( 'Default' ),
			value: useGlobalStyle(
				variationPath + 'elements.link.color.text',
				name
			)[ 0 ],
			handler: useGlobalStyle(
				variationPath + 'elements.link.color.text',
				name
			)[ 1 ],
			userValue: useGlobalStyle(
				variationPath + 'elements.link.color.text',
				name,
				'user'
			)[ 0 ],
		},
		hover: {
			label: __( 'Hover' ),
			value: useGlobalStyle(
				variationPath + 'elements.link.:hover.color.text',
				name
			)[ 0 ],
			handler: useGlobalStyle(
				variationPath + 'elements.link.:hover.color.text',
				name
			)[ 1 ],
			userValue: useGlobalStyle(
				variationPath + 'elements.link.:hover.color.text',
				name,
				'user'
			)[ 0 ],
		},
	};

	if ( ! hasLinkColor ) {
		return null;
	}

	const tabs = Object.entries( pseudoStates ).map(
		( [ selector, config ] ) => {
			return {
				name: selector,
				title: config.label,
				className: `color-text-${ selector }`,
			};
		}
	);

	return (
		<>
			<ScreenHeader
				title={ __( 'Links' ) }
				description={ __(
					'Set the colors used for links across the site.'
				) }
			/>

			<TabPanel tabs={ tabs }>
				{ ( tab ) => {
					const pseudoSelectorConfig =
						pseudoStates[ tab.name ] ?? null;

					if ( ! pseudoSelectorConfig ) {
						return null;
					}

					return (
						<>
							<ColorGradientControl
								className="edit-site-screen-link-color__control"
								colors={ colorsPerOrigin }
								disableCustomColors={ ! areCustomSolidsEnabled }
								showTitle={ false }
								enableAlpha
								__experimentalIsRenderedInSidebar
								colorValue={ pseudoSelectorConfig.value }
								onColorChange={ pseudoSelectorConfig.handler }
								clearable={
									pseudoSelectorConfig.value ===
									pseudoSelectorConfig.userValue
								}
							/>
						</>
					);
				} }
			</TabPanel>
		</>
	);
}

export default ScreenLinkColor;
