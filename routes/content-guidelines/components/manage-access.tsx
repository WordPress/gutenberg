/**
 * WordPress dependencies
 */
import {
	Card,
	ToggleControl,
	__experimentalText as Text,
	__experimentalHeading as Heading,
	__experimentalVStack as VStack,
	Navigator,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { arrowLeft } from '@wordpress/icons';

export default function ManageAccess() {
	const [ allowExternalAccess, setAllowExternalAccess ] = useState( true );

	return (
		<div className="content-guidelines__manage-access">
			<Navigator.BackButton
				icon={ arrowLeft }
				className="content-guidelines__manage-access-back"
			>
				{ __( 'Manage access' ) }
			</Navigator.BackButton>

			<Text
				size={ 13 }
				weight={ 400 }
				className="content-guidelines__manage-access-description"
			>
				{ __( 'Control who can access your content guidelines.' ) }
			</Text>

			<Card className="content-guidelines__manage-access-card">
				<VStack spacing={ 4 }>
					<Heading level={ 3 } size={ 15 } weight={ 500 }>
						{ __( 'External AI agents…' ) }
					</Heading>
					<Text size={ 13 } weight={ 400 }>
						{ sprintf(
							/* translators: %s is a URL path — do not translate */
							__(
								'Share your guidelines with outside AI tools by publishing them to %s. This helps them understand your site and create content that fits.'
							),
							'/.well-known/content-guidelines'
						) }
					</Text>
					<ToggleControl
						label={ __( 'Allow external access' ) }
						checked={ allowExternalAccess }
						onChange={ setAllowExternalAccess }
						__nextHasNoMarginBottom
					/>
				</VStack>
			</Card>
		</div>
	);
}
