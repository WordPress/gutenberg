/**
 * WordPress dependencies
 */
import { __, _x, isRTL } from '@wordpress/i18n';
import { paragraph as icon, formatLtr } from '@wordpress/icons';
import { AlignmentControl, useSettings } from '@wordpress/block-editor';
import {
	ToolbarButton,
	ToggleControl,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import deprecated from './deprecated';
import edit from './edit';
import metadata from './block.json';
import save from './save';
import transforms from './transforms';

const { name } = metadata;

export { metadata, name };

function hasDropCapDisabled( align ) {
	return align === ( isRTL() ? 'left' : 'right' ) || align === 'center';
}

export const settings = {
	icon,
	example: {
		attributes: {
			content: __(
				'In a village of La Mancha, the name of which I have no desire to call to mind, there lived not long since one of those gentlemen that keep a lance in the lance-rack, an old buckler, a lean hack, and a greyhound for coursing.'
			),
		},
	},
	__experimentalLabel( attributes, { context } ) {
		const customName = attributes?.metadata?.name;

		if ( context === 'list-view' && customName ) {
			return customName;
		}

		if ( context === 'accessibility' ) {
			if ( customName ) {
				return customName;
			}

			const { content } = attributes;
			return ! content || content.length === 0 ? __( 'Empty' ) : content;
		}
	},
	transforms,
	deprecated,
	merge( attributes, attributesToMerge ) {
		return {
			content:
				( attributes.content || '' ) +
				( attributesToMerge.content || '' ),
		};
	},
	edit,
	save,
	attributeControls: [
		{
			key: 'align',
			type: 'toolbar',
			group: 'block',
			Control( { attributes, setAttributes } ) {
				const { align, dropCap } = attributes;
				return (
					<AlignmentControl
						value={ align }
						onChange={ ( newAlign ) =>
							setAttributes( {
								align: newAlign,
								dropCap: hasDropCapDisabled( newAlign )
									? false
									: dropCap,
							} )
						}
					/>
				);
			},
		},
		{
			key: 'direction',
			type: 'toolbar',
			group: 'block',
			Control( { attributes, setAttributes } ) {
				const { direction } = attributes;
				return (
					isRTL() && (
						<ToolbarButton
							icon={ formatLtr }
							title={ _x( 'Left to right', 'editor button' ) }
							isActive={ direction === 'ltr' }
							onClick={ () => {
								setAttributes( {
									direction:
										direction === 'ltr' ? undefined : 'ltr',
								} );
							} }
						/>
					)
				);
			},
		},
		{
			key: 'dropCap',
			type: 'inspector',
			group: 'typography',
			Control( { attributes, setAttributes, clientId } ) {
				const [ isDropCapFeatureEnabled ] =
					useSettings( 'typography.dropCap' );

				if ( ! isDropCapFeatureEnabled ) {
					return null;
				}

				const { align, dropCap } = attributes;

				let helpText;
				if ( hasDropCapDisabled( align ) ) {
					helpText = __( 'Not available for aligned text.' );
				} else if ( dropCap ) {
					helpText = __( 'Showing large initial letter.' );
				} else {
					helpText = __( 'Toggle to show a large initial letter.' );
				}

				return (
					<ToolsPanelItem
						hasValue={ () => !! dropCap }
						label={ __( 'Drop cap' ) }
						onDeselect={ () =>
							setAttributes( { dropCap: undefined } )
						}
						resetAllFilter={ () => ( { dropCap: undefined } ) }
						panelId={ clientId }
					>
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Drop cap' ) }
							checked={ !! dropCap }
							onChange={ () =>
								setAttributes( { dropCap: ! dropCap } )
							}
							help={ helpText }
							disabled={
								hasDropCapDisabled( align ) ? true : false
							}
						/>
					</ToolsPanelItem>
				);
			},
		},
	],
};

export const init = () => initBlock( { name, metadata, settings } );
