/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { NavigationLinkUI } from './navigation-link-ui';
import {
	useIsInvalidLink,
	useEnableLinkStatusValidation,
} from '../../navigation-link/shared';

const BLOCKS_WITH_STATUS_INDICATORS = [
	'core/navigation-link',
	'core/navigation-submenu',
];

/**
 * Renders a status badge for invalid/draft navigation links in the list view.
 * Mirrors the in-canvas "(Invalid)" / "(Draft)" indicators shown in the
 * Navigation block's canvas representation.
 *
 * @param {Object} props       Component props.
 * @param {Object} props.block The block object, including clientId, name, and attributes.
 * @return {Element|null} The status indicator, or null if no status to display.
 */
function NavigationLinkListViewStatus( { block } ) {
	const { clientId, name, attributes } = block;
	const { kind, type, id } = attributes;

	const validateLinkStatus = useEnableLinkStatusValidation( clientId );

	const [ isInvalid, isDraft ] = useIsInvalidLink(
		kind,
		type,
		id,
		validateLinkStatus
	);

	if ( ! BLOCKS_WITH_STATUS_INDICATORS.includes( name ) ) {
		return null;
	}

	if ( ! isInvalid && ! isDraft ) {
		return null;
	}

	const statusText = isInvalid
		? /* translators: Indicating that the navigation link is Invalid. */
		  __( 'Invalid' )
		: /* translators: Indicating that the navigation link is a Draft. */
		  __( 'Draft' );

	return (
		<span
			className={ clsx( 'wp-block-navigation-link__list-view-status', {
				'is-invalid': isInvalid,
				'is-draft': isDraft,
			} ) }
			aria-label={ sprintf(
				/* translators: %s: The link status e.g. "Invalid" or "Draft". */
				__( 'Link status: %s' ),
				statusText
			) }
		>
			{ /* Visible status text — hidden from screen readers since aria-label above provides the accessible name. */ }
			<span aria-hidden="true">{ `(${ statusText })` }</span>
		</span>
	);
}

/**
 * Combined additional block content for the navigation list view.
 *
 * Renders both:
 * 1. The link insertion UI for newly inserted navigation link blocks.
 * 2. A status indicator for existing navigation link blocks that are
 *    invalid (deleted/trashed) or in draft status.
 *
 * This matches the in-canvas indicators already shown in the Navigation block's
 * canvas representation, ensuring consistent feedback in both editing modes.
 *
 * @param {Object}   props                  Component props (passed through from PrivateListView).
 * @param {Object}   props.block            The block object.
 * @param {Object}   props.insertedBlock    The most recently inserted block, if any.
 * @param {Function} props.setInsertedBlock Setter for the inserted block state.
 * @return {Element} The combined additional block content.
 */
export function NavigationListViewAdditionalContent( props ) {
	return (
		<>
			<NavigationLinkUI { ...props } />
			<NavigationLinkListViewStatus block={ props.block } />
		</>
	);
}
