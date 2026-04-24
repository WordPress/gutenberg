/**
 * WordPress dependencies
 */
import { Card, CardBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
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

			<Card
				size="small"
				isBorderless
				className="global-styles-ui-screen-style-variations"
			>
				<CardBody>
					<StyleVariationsContent />
				</CardBody>
			</Card>
		</>
	);
}

export default ScreenStyleVariations;
