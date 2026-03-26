/**
 * WordPress dependencies
 */
import {
	Button,
	__experimentalText as Text,
	__experimentalHeading as Heading,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
} from '@wordpress/components';

interface ActionProps {
	slug: string;
	title: string;
	description: string;
	buttonLabel: string;
	ariaLabel: string;
	onClick: () => void;
	disabled?: boolean;
	isBusy?: boolean;
}
export default function ActionItem( {
	slug,
	title,
	description,
	buttonLabel,
	ariaLabel,
	onClick,
	disabled,
	isBusy,
}: ActionProps ) {
	const descriptionId = `content-guidelines-action-${ slug }-description`;

	return (
		<li className="content-guidelines__action-list-item">
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
						{ title }
					</Heading>
					<Text
						id={ descriptionId }
						size={ 13 }
						weight={ 400 }
						variant="muted"
						className="content-guidelines__action-description"
					>
						{ description }
					</Text>
				</VStack>
				<Button
					size="compact"
					variant="secondary"
					className="content-guidelines__action-button"
					aria-label={ ariaLabel }
					aria-describedby={ descriptionId }
					onClick={ onClick }
					isBusy={ isBusy }
					disabled={ disabled }
				>
					{ buttonLabel }
				</Button>
			</HStack>
		</li>
	);
}
