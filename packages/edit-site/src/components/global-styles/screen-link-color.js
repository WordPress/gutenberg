/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { __experimentalColorGradientControl as ColorGradientControl } from '@wordpress/block-editor';
import { TabPanel } from '@wordpress/components';
/**
 * Internal dependencies
 */
import ScreenHeader from './header';
import {
	getSupportedGlobalStylesPanels,
	useSetting,
	useStyle,
	useColorsPerOrigin,
} from './hooks';

function ucFirst( str ) {
	if ( ! str ) return str;
	return str[ 0 ].toUpperCase() + str.slice( 1 );
}

function ScreenLinkColor( { name } ) {
	const supports = getSupportedGlobalStylesPanels( name );
	const [ solids ] = useSetting( 'color.palette', name );
	const [ areCustomSolidsEnabled ] = useSetting( 'color.custom', name );

	const colorsPerOrigin = useColorsPerOrigin( name );

	const [ isLinkEnabled ] = useSetting( 'color.link', name );

	const hasLinkColor =
		supports.includes( 'linkColor' ) &&
		isLinkEnabled &&
		( solids.length > 0 || areCustomSolidsEnabled );

	const pseudoStates = {
		default: {
			...useStyle( 'elements.link.color.text', name ).reduce(
				( acc, psuedoSelector, index ) => {
					acc[ index === 0 ? 'value' : 'handler' ] = psuedoSelector;
					return acc;
				},
				{}
			),
			userValue: useStyle(
				'elements.link.color.text',
				name,
				'user'
			)[ 0 ],
		},
		hover: {
			...useStyle( 'elements.link.:hover.color.text', name ).reduce(
				( acc, psuedoSelector, index ) => {
					acc[ index === 0 ? 'value' : 'handler' ] = psuedoSelector;
					return acc;
				},
				{}
			),
			userValue: useStyle(
				'elements.link.:hover.color.text',
				name,
				'user'
			)[ 0 ],
		},
	};

	if ( ! hasLinkColor ) {
		return null;
	}

	const tabs = Object.keys( pseudoStates ).map( ( pseudoSelector ) => {
		return {
			name: pseudoSelector,
			title: ucFirst( pseudoSelector ),
			className: `color-text-${ pseudoSelector }`,
		};
	} );

	return (
		<>
			<ScreenHeader
				title={ __( 'Links' ) }
				description={ __(
					'Set the colors used for links across the site.'
				) }
			/>

			<TabPanel className="my-tab-panel" tabs={ tabs }>
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
								__experimentalHasMultipleOrigins
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
