import {
	BaseControl,
	Button,
	Icon as WCIcon,
	__experimentalGrid as Grid,
	Popover,
	useBaseControlProps,
} from '@wordpress/components';
import { useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { link } from '@wordpress/icons';
import { prependHTTP } from '@wordpress/url';
import LinkControl from '../../../components/link-control';
import { useInspectorPopoverPlacement } from '../use-inspector-popover-placement';

export const NEW_TAB_REL = 'noopener';
export const NEW_TAB_TARGET = '_blank';
export const NOFOLLOW_REL = 'nofollow';

/**
 * The link settings the control knows how to map onto the block's `rel` and
 * `linkTarget` attributes, keyed by the ids accepted in the field's
 * `Edit.settings` config.
 */
const AVAILABLE_SETTINGS = [
	...LinkControl.DEFAULT_LINK_SETTINGS,
	{
		id: 'nofollow',
		title: __( 'Mark as nofollow' ),
	},
];

const DEFAULT_SETTING_IDS = LinkControl.DEFAULT_LINK_SETTINGS.map(
	( setting ) => setting.id
);

/**
 * Resolves the setting ids declared in the field config into the settings
 * passed to `LinkControl`.
 *
 * @param {string[]} settingIds Setting ids declared by the field.
 *
 * @return {Object[]} Settings for `LinkControl`.
 */
export function getLinkSettings( settingIds ) {
	return AVAILABLE_SETTINGS.filter( ( setting ) =>
		settingIds.includes( setting.id )
	);
}

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
	data,
	field,
	onChange,
	hideLabelFromVision,
	config = {},
} ) {
	const [ isLinkControlOpen, setIsLinkControlOpen ] = useState( false );
	const { popoverProps } = useInspectorPopoverPlacement( {
		isControl: true,
	} );
	const { baseControlProps, controlProps } = useBaseControlProps( {
		hideLabelFromVision: hideLabelFromVision ?? field.hideLabelFromVision,
		label: field.label,
	} );
	const value = field.getValue( { item: data } );
	const url = value?.url;
	const rel = value?.rel || '';
	const target = value?.linkTarget;

	const opensInNewTab = target === NEW_TAB_TARGET;
	const nofollow = rel.includes( NOFOLLOW_REL );

	const { settings: settingIds, suggestionsQuery } = config;
	const settings = useMemo(
		() => getLinkSettings( settingIds ?? DEFAULT_SETTING_IDS ),
		[ settingIds ]
	);

	// Memoize link value to avoid overriding the LinkControl's internal state.
	// This is a temporary fix. See https://github.com/WordPress/gutenberg/issues/51256.
	const linkValue = useMemo(
		() => ( { url, opensInNewTab, nofollow } ),
		[ url, opensInNewTab, nofollow ]
	);

	return (
		<BaseControl { ...baseControlProps }>
			<Button
				__next40pxDefaultSize
				className="block-editor-content-only-controls__link"
				onClick={ () => {
					setIsLinkControlOpen( true );
				} }
				{ ...controlProps }
			>
				<Grid
					rowGap={ 0 }
					columnGap={ 8 }
					templateColumns="24px 1fr"
					className="block-editor-content-only-controls__link-row"
				>
					{ url && (
						<>
							<WCIcon icon={ link } size={ 24 } />
							<span className="block-editor-content-only-controls__link-title">
								{ url }
							</span>
						</>
					) }
					{ ! url && (
						<>
							<WCIcon
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
						settings={ settings }
						suggestionsQuery={ suggestionsQuery }
						onChange={ ( newValues ) => {
							const updatedAttrs = getUpdatedLinkAttributes( {
								rel,
								...newValues,
							} );

							onChange(
								field.setValue( {
									item: data,
									value: updatedAttrs,
								} )
							);
						} }
						onRemove={ () => {
							onChange(
								field.setValue( {
									item: data,
									value: {},
								} )
							);
						} }
					/>
				</Popover>
			) }
		</BaseControl>
	);
}
