/**
 * WordPress dependencies
 */
import {
	Button,
	__experimentalText as WCText,
	__experimentalHeading as Heading,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
} from '@wordpress/components';

interface ActionProps {
	slug: 'import' | 'export' | 'revert';
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
	const descriptionId = `guidelines-action-${ slug }-description`;

	return (
		<HStack justify="space-between" className="guidelines__action-row">
			<VStack spacing={ 1 }>
				<Heading
					level={ 3 }
					size={ 13 }
					weight={ 400 }
					className="guidelines__action-title"
				>
					{ title }
				</Heading>
				<WCText
					id={ descriptionId }
					size={ 13 }
					weight={ 400 }
					variant="muted"
					className="guidelines__action-description"
				>
					{ description }
				</WCText>
			</VStack>
			<Button
				size="compact"
				variant="secondary"
				className="guidelines__action-button"
				aria-label={ ariaLabel }
				aria-describedby={ descriptionId }
				onClick={ onClick }
				isBusy={ isBusy }
				disabled={ disabled }
				accessibleWhenDisabled
			>
				{ buttonLabel }
			</Button>
		</HStack>
	);
}
