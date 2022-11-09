/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Icon, plusCircle } from '@wordpress/icons';
import { Tooltip, Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import ScreenHeader from './header';
import FontFaceItem from './font-face-item';
import Subtitle from './subtitle';

function ScreenGoogleFontFacesList( { googleFontSelected: font } ) {
	return (
		<>
			<ScreenHeader
				title={ __( 'Add Google Font Variants' ) }
				description={ __(
					'Select the font variants you want to include in your site'
				) }
			/>

			<div
				style={ {
					background: '#eee',
					padding: '1rem',
					display: 'flex',
					flexDirection: 'column',
					gap: '1rem',
				} }
			>
				<Subtitle>{ font.family + __( ' variants:' ) }</Subtitle>

				{ font &&
					font.variants.map( ( variant ) => {
						const fontFace = {
							fontFamily: font.family,
							fontStyle: variant.includes( 'italic' )
								? 'italic'
								: 'normal',
							fontWeight:
								variant.replace( 'italic', '' ) === 'regular'
									? '400'
									: variant.replace( 'italic', '' ),
							url: font.files[ variant ],
						};

						return (
							<FontFaceItem
								key={ variant }
								fontFace={ fontFace }
								title={ variant }
								actionTrigger={
									<Tooltip
										text={ __( 'Add font face' ) }
										delay={ 0 }
									>
										<Button style={ { padding: '0 8px' } }>
											<Icon
												icon={ plusCircle }
												size={ 20 }
											/>
										</Button>
									</Tooltip>
								}
							/>
						);
					} ) }
			</div>
		</>
	);
}

export default ScreenGoogleFontFacesList;
