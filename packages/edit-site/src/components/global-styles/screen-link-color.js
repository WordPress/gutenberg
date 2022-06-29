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

	const [ linkColor, setLinkColor ] = useStyle(
		'elements.link.color.text',
		name
	);

	const [ linkHoverColor, setLinkHoverColor ] = useStyle(
		'elements.link.:hover.color.text',
		name
	);

	const [ userLinkColor ] = useStyle(
		'elements.link.color.text',
		name,
		'user'
	);

	const [ userLinkHoverColor ] = useStyle(
		'elements.link.:hover.color.text',
		name,
		'user'
	);

	const PSEUDOSTATES = {
		default: {
			value: linkColor,
			handler: setLinkColor,
			userValue: userLinkColor,
		},
		hover: {
			value: linkHoverColor,
			handler: setLinkHoverColor,
			userValue: userLinkHoverColor,
		},
	};

	if ( ! hasLinkColor ) {
		return null;
	}

	const tabs = Object.keys( PSEUDOSTATES ).map( ( pseudoSelector ) => {
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
					const psuedoSelector = tab.name;

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
								colorValue={
									PSEUDOSTATES[ psuedoSelector ].value
								}
								onColorChange={
									PSEUDOSTATES[ psuedoSelector ].handler
								}
								clearable={
									PSEUDOSTATES[ psuedoSelector ].value ===
									PSEUDOSTATES[ psuedoSelector ].userValue
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
