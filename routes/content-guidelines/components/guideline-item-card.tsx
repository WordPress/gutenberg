/**
 * WordPress dependencies
 */
import {
	Icon,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { chevronRight } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import './guideline-item-card.scss';

interface GuidelineItemCardProps {
	icon: JSX.Element;
	title: string;
	description: string;
	onClick: () => void;
}

export default function GuidelineItemCard( {
	icon,
	title,
	description,
	onClick,
}: GuidelineItemCardProps ) {
	const baseId = useInstanceId(
		GuidelineItemCard,
		'content-guidelines__card'
	);
	const titleId = `${ baseId }-title`;
	const descriptionId = `${ baseId }-description`;

	return (
		<button
			type="button"
			className="content-guidelines__card"
			aria-labelledby={ titleId }
			aria-describedby={ descriptionId }
			onClick={ onClick }
		>
			<HStack justify="flex-start" alignment="start" spacing={ 3 }>
				<span
					className="content-guidelines__card-icon"
					aria-hidden="true"
				>
					<Icon icon={ icon } />
				</span>
				<VStack
					spacing={ 2 }
					className="content-guidelines__card-content"
				>
					<strong
						className="content-guidelines__card-title"
						id={ titleId }
					>
						{ title }
					</strong>
					<span
						className="content-guidelines__card-description"
						id={ descriptionId }
					>
						{ description }
					</span>
				</VStack>
				<Icon
					icon={ chevronRight }
					className="content-guidelines__card-chevron"
					aria-hidden="true"
				/>
			</HStack>
		</button>
	);
}
