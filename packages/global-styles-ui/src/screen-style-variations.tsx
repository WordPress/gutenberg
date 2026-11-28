import { Card as WCCard, CardBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { ScreenHeader } from './screen-header';
import { StyleVariationsContent } from './style-variations-content';

function ScreenStyleVariations() {
	return (
		<>
			<ScreenHeader
				title={ __( 'Browse styles' ) }
				description={ __(
					'Choose a variation to change the look of the site.'
				) }
			/>

			<WCCard
				size="small"
				isBorderless
				className="global-styles-ui-screen-style-variations"
			>
				<CardBody>
					<StyleVariationsContent />
				</CardBody>
			</WCCard>
		</>
	);
}

export default ScreenStyleVariations;
