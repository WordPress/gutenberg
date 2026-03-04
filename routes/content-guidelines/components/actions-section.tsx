/**
 * WordPress dependencies
 */
import {
	Button,
	Card,
	__experimentalText as Text,
	__experimentalHeading as Heading,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const ACTIONS = [
	{
		slug: 'import',
		title: __( 'Import' ),
		description: __(
			'Upload a JSON file to import your content guidelines.'
		),
		buttonLabel: __( 'Upload' ),
		ariaLabel: __( 'Import content guidelines' ),
	},
	{
		slug: 'export',
		title: __( 'Export' ),
		description: __( 'Export your content guidelines to a JSON file.' ),
		buttonLabel: __( 'Download' ),
		ariaLabel: __( 'Export content guidelines' ),
	},
	{
		slug: 'manage-access',
		title: __( 'Manage access' ),
		description: __( 'Control who can access your content guidelines.' ),
		buttonLabel: __( 'Manage' ),
		ariaLabel: __( 'Manage access to content guidelines' ),
	},
	{
		slug: 'revert',
		title: __( 'Revert' ),
		description: __( 'Use a previous version of your content guidelines.' ),
		buttonLabel: __( 'View history' ),
		ariaLabel: __( 'View history of content guidelines' ),
	},
];

export default function ActionsSection() {
	return (
		<VStack spacing={ 3 } className="content-guidelines__actions">
			<Heading level={ 2 } size={ 15 } weight={ 600 }>
				{ __( 'Actions' ) }
			</Heading>
			<Card className="content-guidelines__actions-card">
				{ /*
				 * Disable reason: The `list` ARIA role is redundant but
				 * Safari+VoiceOver won't announce the list otherwise.
				 */
				/* eslint-disable jsx-a11y/no-redundant-roles */ }
				<ul role="list" className="content-guidelines__actions-list">
					{ ACTIONS.map( ( action, index ) => {
						const descriptionId = `content-guidelines-action-${ action.slug }-description`;
						return (
							<li key={ action.slug }>
								<HStack
									justify="space-between"
									className={
										'content-guidelines__action-row' +
										( index < ACTIONS.length - 1
											? ' content-guidelines__action-row--bordered'
											: '' )
									}
								>
									<VStack spacing={ 1 }>
										<Heading
											level={ 3 }
											size={ 13 }
											weight={ 500 }
											className="content-guidelines__action-title"
										>
											{ action.title }
										</Heading>
										<Text
											id={ descriptionId }
											size={ 13 }
											weight={ 400 }
											variant="muted"
											className="content-guidelines__action-description"
										>
											{ action.description }
										</Text>
									</VStack>
									<Button
										variant="secondary"
										__next40pxDefaultSize
										aria-label={ action.ariaLabel }
										aria-describedby={ descriptionId }
									>
										{ action.buttonLabel }
									</Button>
								</HStack>
							</li>
						);
					} ) }
				</ul>
				{ /* eslint-enable jsx-a11y/no-redundant-roles */ }
			</Card>
		</VStack>
	);
}
