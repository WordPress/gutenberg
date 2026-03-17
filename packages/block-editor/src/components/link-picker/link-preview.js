/**
 * WordPress dependencies
 */
import {
	__experimentalTruncate as Truncate,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	FlexItem,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { Icon, chevronDown } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { Badge } = unlock( componentsPrivateApis );

/**
 * Link preview component that displays the current link information.
 * This is a presentational component meant to be wrapped in a button.
 *
 * @param {Object}        props        - Component props
 * @param {string}        props.title  - Display title for the link
 * @param {string}        props.url    - Display URL for the link
 * @param {string}        props.image  - Optional image URL for the link preview
 * @param {Array<Object>} props.badges - Optional array of badge objects with label and intent
 */
export function LinkPreview( { title, url, image, badges } ) {
	return (
		<HStack justify="space-between" alignment="top">
			<FlexItem className="link-preview-button__content">
				<HStack alignment="top">
					{ image && (
						<FlexItem className="link-preview-button__image-container">
							<img
								className="link-preview-button__image"
								src={ image }
								alt=""
							/>
						</FlexItem>
					) }

					<VStack
						className="link-preview-button__details"
						alignment="topLeft"
					>
						<Truncate
							numberOfLines={ 1 }
							className="link-preview-button__title"
						>
							{ title }
						</Truncate>
						{ url && (
							<Truncate
								numberOfLines={ 1 }
								className="link-preview-button__hint"
							>
								{ url }
							</Truncate>
						) }
						{ badges && badges.length > 0 && (
							<HStack
								className="link-preview-button__badges"
								alignment="left"
							>
								{ badges.map( ( badge ) => (
									<Badge
										key={ `${ badge.label }|${ badge.intent }` }
										intent={ badge.intent }
									>
										{ badge.label }
									</Badge>
								) ) }
							</HStack>
						) }
					</VStack>
				</HStack>
			</FlexItem>
			<Icon icon={ chevronDown } className="link-preview-button__icon" />
		</HStack>
	);
}
