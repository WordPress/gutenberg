/**
 * WordPress dependencies
 */
import {
	Button,
	Icon,
	__experimentalGrid as Grid,
	Popover,
} from '@wordpress/components';
import { useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { link } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import LinkControl from '../../link-control';
import { useInspectorPopoverPlacement } from '../use-inspector-popover-placement';

export const NEW_TAB_REL = 'noreferrer noopener';
export const NEW_TAB_TARGET = '_blank';
export const NOFOLLOW_REL = 'nofollow';

/**
 * Updates the link attributes based on LinkControl changes.
 *
 * @param {Object}  args               - Arguments object.
 * @param {string}  args.rel           - Current rel attribute.
 * @param {string}  args.url           - Current URL.
 * @param {boolean} args.opensInNewTab - Whether link opens in new tab.
 * @param {boolean} args.nofollow      - Whether link has nofollow.
 * @return {Object} Updated link attributes.
 */
export function getUpdatedLinkAttributes( {
	rel = '',
	url = '',
	opensInNewTab,
	nofollow,
} ) {
	let newLinkTarget;
	let updatedRel = rel;

	if ( opensInNewTab ) {
		newLinkTarget = NEW_TAB_TARGET;
		updatedRel = updatedRel?.includes( NEW_TAB_REL )
			? updatedRel
			: updatedRel + ` ${ NEW_TAB_REL }`;
	} else {
		const relRegex = new RegExp( `\\b${ NEW_TAB_REL }\\s*`, 'g' );
		updatedRel = updatedRel?.replace( relRegex, '' ).trim();
	}

	if ( nofollow ) {
		updatedRel = updatedRel?.includes( NOFOLLOW_REL )
			? updatedRel
			: ( updatedRel + ` ${ NOFOLLOW_REL }` ).trim();
	} else {
		const relRegex = new RegExp( `\\b${ NOFOLLOW_REL }\\s*`, 'g' );
		updatedRel = updatedRel?.replace( relRegex, '' ).trim();
	}

	return {
		url,
		linkTarget: newLinkTarget,
		rel: updatedRel || undefined,
	};
}

/**
 * LinkEdit component for DataForm integration.
 * Provides link editing capabilities compatible with DataForm's Edit component API.
 *
 * @param {Object}   props          - Component props.
 * @param {Object}   props.data     - Block attributes.
 * @param {Object}   props.field    - DataForm field configuration with mapping.
 * @param {Function} props.onChange - Callback for value changes.
 */
export default function LinkEdit( { data, field, onChange } ) {
	const [ isLinkControlOpen, setIsLinkControlOpen ] = useState( false );
	const { popoverProps } = useInspectorPopoverPlacement( {
		isControl: true,
	} );

	// Get the attribute keys from the field mapping
	const mapping = field.mapping || {};
	const hrefKey = mapping.href || 'url';
	const relKey = mapping.rel;
	const targetKey = mapping.target || 'linkTarget';
	const destinationKey = mapping.destination;

	// Get values from data
	const href = data[ hrefKey ];
	const rel = data[ relKey ];
	const target = data[ targetKey ];

	const opensInNewTab = target === NEW_TAB_TARGET;
	const nofollow = rel === NOFOLLOW_REL;

	// Memoize link value to avoid overriding the LinkControl's internal state
	const linkValue = useMemo(
		() => ( { url: href, opensInNewTab, nofollow } ),
		[ href, opensInNewTab, nofollow ]
	);

	return (
		<>
			<Button
				__next40pxDefaultSize
				className="block-editor-content-only-controls__link"
				onClick={ () => {
					setIsLinkControlOpen( true );
				} }
			>
				<Grid
					rowGap={ 0 }
					columnGap={ 8 }
					templateColumns="24px 1fr"
					className="block-editor-content-only-controls__link-row"
				>
					{ href && (
						<>
							<Icon icon={ link } size={ 24 } />
							<span className="block-editor-content-only-controls__link-title">
								{ href }
							</span>
						</>
					) }
					{ ! href && (
						<>
							<Icon
								icon={ link }
								size={ 24 }
								style={ { opacity: 0.3 } }
							/>
							<span className="block-editor-content-only-controls__link-title">
								{ __( 'Link' ) }
							</span>
						</>
					) }
				</Grid>
			</Button>
			{ isLinkControlOpen && (
				<Popover
					onClose={ () => {
						setIsLinkControlOpen( false );
					} }
					{ ...( popoverProps ?? {} ) }
				>
					<LinkControl
						value={ linkValue }
						onChange={ ( newValues ) => {
							const updatedAttrs = getUpdatedLinkAttributes( {
								rel,
								...newValues,
							} );

							// Call DataForm's onChange with updated attributes
							const updates = {};
							if ( hrefKey ) {
								updates[ hrefKey ] = updatedAttrs.url;
							}
							if ( relKey ) {
								updates[ relKey ] = updatedAttrs.rel;
							}
							if ( targetKey ) {
								updates[ targetKey ] = updatedAttrs.linkTarget;
							}

							onChange( updates );
						} }
						onRemove={ () => {
							// Reset link to defaults
							const updates = {};
							if ( hrefKey ) {
								updates[ hrefKey ] = undefined;
							}
							if ( relKey ) {
								updates[ relKey ] = undefined;
							}
							if ( targetKey ) {
								updates[ targetKey ] = undefined;
							}
							if ( destinationKey ) {
								updates[ destinationKey ] = undefined;
							}

							onChange( updates );
						} }
					/>
				</Popover>
			) }
		</>
	);
}
