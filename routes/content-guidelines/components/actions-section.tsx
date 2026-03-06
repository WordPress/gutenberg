/**
 * WordPress dependencies
 */
import {
	Button,
	Card,
	useNavigator,
	__experimentalText as Text,
	__experimentalHeading as Heading,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { importContentGuidelines, exportContentGuidelines } from '../api';

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
		slug: 'revert',
		title: __( 'Revert' ),
		description: __( 'Use a previous version of your content guidelines.' ),
		buttonLabel: __( 'View history' ),
		ariaLabel: __( 'View history of content guidelines' ),
	},
];

export default function ActionsSection() {
	const { goTo } = useNavigator();
	const fileInputRef = useRef< HTMLInputElement >( null );
	const [ isImporting, setIsImporting ] = useState( false );

	function handleImportClick() {
		fileInputRef.current?.click();
	}

	async function handleFileChange(
		event: React.ChangeEvent< HTMLInputElement >
	) {
		const file = event.target.files?.[ 0 ];
		if ( ! file ) {
			return;
		}
		event.target.value = ''; // allow re-importing the same file
		setIsImporting( true );
		try {
			await importContentGuidelines( file );
		} finally {
			setIsImporting( false );
		}
	}

	function handleExportClick() {
		exportContentGuidelines();
	}

	const buttonProps: Partial<
		Record<
			string,
			{ onClick: () => void; isBusy?: boolean; disabled?: boolean }
		>
	> = {
		import: {
			onClick: handleImportClick,
			isBusy: isImporting,
			disabled: isImporting,
		},
		export: { onClick: handleExportClick },
		revert: { onClick: () => goTo( '/revision-history' ) },
	};

	return (
		<VStack spacing={ 4 } className="content-guidelines__actions">
			<Heading level={ 3 } size={ 15 } weight={ 500 }>
				{ __( 'Actions' ) }
			</Heading>
			<input
				type="file"
				accept=".json"
				ref={ fileInputRef }
				onChange={ handleFileChange }
				style={ { display: 'none' } }
			/>
			<Card className="content-guidelines__actions-card">
				{ /*
				 * Disable reason: The `list` ARIA role is redundant but
				 * Safari+VoiceOver won't announce the list otherwise.
				 */
				/* eslint-disable jsx-a11y/no-redundant-roles */ }
				<ul role="list" className="content-guidelines__actions-list">
					{ ACTIONS.map( ( action ) => {
						const descriptionId = `content-guidelines-action-${ action.slug }-description`;
						return (
							<li
								key={ action.slug }
								className="content-guidelines__action-list-item"
							>
								<HStack
									justify="space-between"
									className="content-guidelines__action-row"
								>
									<VStack spacing={ 1 }>
										<Heading
											level={ 3 }
											size={ 13 }
											weight={ 400 }
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
										size="compact"
										variant="secondary"
										aria-label={ action.ariaLabel }
										aria-describedby={ descriptionId }
										{ ...( buttonProps[ action.slug ] ??
											{} ) }
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
