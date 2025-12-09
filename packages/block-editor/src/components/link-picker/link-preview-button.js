/**
 * WordPress dependencies
 */
import {
	Button,
	__experimentalTruncate as Truncate,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	FlexItem,
	VisuallyHidden,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { Icon, chevronDown } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { Badge } = unlock( componentsPrivateApis );

/**
 * Link preview button component that displays the current link information.
 * Clicking this button reveals the LinkControlSearchInput.
 *
 * @param {Object}   props         - Component props
 * @param {Object}   props.preview - Preview data with title, url, image, badges
 * @param {Function} props.onClick - Click handler
 * @param {string}   props.label   - Label for the button (e.g. "Link to")
 * @param {Object}   props.props   - Additional props to pass to the button
 */
export function LinkPreviewButton( { preview, onClick, label, ...props } ) {
	const { title, url: displayUrl, image, badges } = preview || {};

	// Fallback for missing title
	const displayTitle = title || __( 'Add link' );

	return (
		<Button
			className="link-preview-button"
			onClick={ onClick }
			variant="secondary"
			__next40pxDefaultSize
			{ ...props }
		>
			{ label && <VisuallyHidden>{ label }:</VisuallyHidden> }
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
								{ displayTitle }
							</Truncate>
							{ displayUrl && (
								<Truncate
									numberOfLines={ 1 }
									className="link-preview-button__hint"
								>
									{ displayUrl }
								</Truncate>
							) }
							{ badges && badges.length > 0 && (
								<HStack
									className="link-preview-button__badges"
									alignment="left"
								>
									{ badges.map( ( badge, index ) => (
										<Badge
											key={ index }
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
				<Icon
					icon={ chevronDown }
					className="link-preview-button__icon"
				/>
			</HStack>
		</Button>
	);
}
