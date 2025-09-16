/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Button,
	Navigator,
	ExternalLink,
	__experimentalSpacer as Spacer,
} from '@wordpress/components';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as editSiteStore } from '../../store';
import ScreenHeader from './header';

const { useGlobalStyle, AdvancedPanel: StylesAdvancedPanel } = unlock(
	blockEditorPrivateApis
);

function ScreenCSS() {
	const [ style ] = useGlobalStyle( '', undefined, 'user', {
		shouldDecodeEncode: false,
	} );
	const [ inheritedStyle, setStyle ] = useGlobalStyle( '', undefined, 'all', {
		shouldDecodeEncode: false,
	} );

	const { setEditorCanvasContainerView } = unlock(
		useDispatch( editSiteStore )
	);

	return (
		<>
			<ScreenHeader
				title={ __( 'Additional CSS' ) }
				description={
					<>
						{ __(
							'You can add custom CSS to further customize the appearance and layout of your site.'
						) }
						<br />
						<ExternalLink
							href={ __(
								'https://developer.wordpress.org/advanced-administration/wordpress/css/'
							) }
							className="edit-site-global-styles-screen-css-help-link"
						>
							{ __( 'Learn more about CSS' ) }
						</ExternalLink>
					</>
				}
				onBack={ () => {
					setEditorCanvasContainerView( undefined );
				} }
			/>
			<Spacer margin={ 0 } paddingX={ 4 }>
				<Navigator.Button as={ Button } variant="link" path="/blocks">
					{ __(
						'Want to change block appearance? Use the Blocкs section instead.'
					) }
				</Navigator.Button>
			</Spacer>
			<div className="edit-site-global-styles-screen-css">
				<StylesAdvancedPanel
					value={ style }
					onChange={ setStyle }
					inheritedValue={ inheritedStyle }
				/>
			</div>
		</>
	);
}

export default ScreenCSS;
