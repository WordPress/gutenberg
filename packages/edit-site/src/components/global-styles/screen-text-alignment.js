/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { __experimentalVStack as VStack, Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import ScreenHeader from './header';
import Subtitle from './subtitle';
import BlockPreviewPanel from './block-preview-panel';
import {
	alignCenter,
	alignJustify,
	alignLeft,
	alignRight,
} from '@wordpress/icons';

const DEFAULT_ALIGNMENT_CONTROLS = [
	{
		icon: alignLeft,
		title: __( 'Align text left' ),
		align: 'left',
	},
	{
		icon: alignCenter,
		title: __( 'Align text center' ),
		align: 'center',
	},
	{
		icon: alignRight,
		title: __( 'Align text right' ),
		align: 'right',
	},
	{
		icon: alignJustify,
		title: __( 'Align justify' ),
		align: 'justify',
	},
];

function ScreenTextAlignment() {
	return (
		<>
			<ScreenHeader
				title={ __( 'Global Text Alignment' ) }
				description={ __(
					'Manage the global text alignment for pages and posts content.'
				) }
			/>

			<BlockPreviewPanel />

			<div className="edit-site-global-styles-screen-typography">
				<VStack spacing={ 3 }>
					<Subtitle level={ 3 }>{ __( 'Alignment' ) }</Subtitle>
					{ DEFAULT_ALIGNMENT_CONTROLS.map(
						( { icon, title, align } ) => (
							<Button
								icon={ icon }
								key={ title }
								onClick={ () => {
									// TODO: update the style with useGlobalStyle
									// eslint-disable-next-line no-console
									console.log( 'clicked', align );
								} }
							>
								{ title }
							</Button>
						)
					) }
				</VStack>
			</div>
		</>
	);
}

export default ScreenTextAlignment;
