/**
 * WordPress dependencies
 */
import {
	Button,
	Icon,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalGrid as Grid,
	Popover,
} from '@wordpress/components';
import { useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { link } from '@wordpress/icons';
import { prependHTTP } from '@wordpress/url';

/**
 * Internal dependencies
 */
import LinkControl from '../../link-control';
import { useInspectorPopoverPlacement } from '../use-inspector-popover-placement';

export const NEW_TAB_REL = 'noreferrer noopener';
export const NEW_TAB_TARGET = '_blank';
export const NOFOLLOW_REL = 'nofollow';

/**
 * Updates the link attributes.
 *
 * @param {Object}  attributes               The current block attributes.
 * @param {string}  attributes.rel           The current link rel attribute.
 * @param {string}  attributes.url           The current link url.
 * @param {boolean} attributes.opensInNewTab Whether the link should open in a new window.
 * @param {boolean} attributes.nofollow      Whether the link should be marked as nofollow.
 */
export function getUpdatedLinkAttributes( {
	rel = '',
	url = '',
	opensInNewTab,
	nofollow,
} ) {
	let newLinkTarget;
	// Since `rel` is editable attribute, we need to check for existing values and proceed accordingly.
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
		url: prependHTTP( url ),
		linkTarget: newLinkTarget,
		rel: updatedRel || undefined,
	};
}

export default function Link( {
	clientId,
	control,
	blockType,
	attributeValues,
	updateAttributes,
} ) {
	const [ isLinkControlOpen, setIsLinkControlOpen ] = useState( false );
	const { popoverProps } = useInspectorPopoverPlacement( {
		isControl: true,
	} );
	const hrefKey = control.mapping.href;
	const relKey = control.mapping.rel;
	const targetKey = control.mapping.target;
	const destinationKey = control.mapping.destination;

	const href = attributeValues[ hrefKey ];
	const rel = attributeValues[ relKey ];
	const target = attributeValues[ targetKey ];
	const destination = attributeValues[ destinationKey ];

	const hrefDefaultValue =
		blockType.attributes[ href ]?.defaultValue ?? undefined;
	const relDefaultValue =
		blockType.attributes[ rel ]?.defaultValue ?? undefined;
	const targetDefaultValue =
		blockType.attributes[ target ]?.defaultValue ?? undefined;
	const destinationDefaultValue =
		blockType.attributes[ destination ]?.defaultValue ?? undefined;

	const opensInNewTab = target === NEW_TAB_TARGET;
	const nofollow = rel === NOFOLLOW_REL;

	// Memoize link value to avoid overriding the LinkControl's internal state.
	// This is a temporary fix. See https://github.com/WordPress/gutenberg/issues/51256.
	const linkValue = useMemo(
		() => ( { url: href, opensInNewTab, nofollow } ),
		[ href, opensInNewTab, nofollow ]
	);

	return (
		<ToolsPanelItem
			panelId={ clientId }
			label={ control.label }
			hasValue={ () => !! href }
			onDeselect={ () => {
				updateAttributes( {
					[ hrefKey ]: hrefDefaultValue,
					[ relKey ]: relDefaultValue,
					[ targetKey ]: targetDefaultValue,
					[ destinationKey ]: destinationDefaultValue,
				} );
			} }
			isShownByDefault={ control.shownByDefault }
		>
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

							updateAttributes( {
								[ hrefKey ]: updatedAttrs.url,
								[ relKey ]: updatedAttrs.rel,
								[ targetKey ]: updatedAttrs.linkTarget,
							} );
						} }
						onRemove={ () => {
							updateAttributes( {
								[ hrefKey ]: hrefDefaultValue,
								[ relKey ]: relDefaultValue,
								[ targetKey ]: targetDefaultValue,
								[ destinationKey ]: destinationDefaultValue,
							} );
						} }
					/>
				</Popover>
			) }
		</ToolsPanelItem>
	);
}
