/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	PanelBody,
	// __experimentalHStack as HStack,
	// __experimentalVStack as VStack,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { arrowLeft, arrowRight, arrowUp } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

const effectsOptions = [
	{
		label: __( 'Slide from left' ),
		value: 'slide-from-left',
		icon: arrowRight,
	},
	{
		label: __( 'Slide from right' ),
		value: 'slide-from-right',
		icon: arrowLeft,
	},
	{
		label: __( 'Slide from bottom' ),
		value: 'slide-from-bottom',
		icon: arrowUp,
	},
];

// TODO: attributes would be: `effect` with the data and `effectType`(entrance, exit, etc..).

export default function BlockEditorEffectsPanel( { clientId } ) {
	const effect = useSelect(
		( select ) => {
			const { getBlockAttributes } = select( blockEditorStore );
			return getBlockAttributes( clientId ).effect;
		},
		[ clientId ]
	);
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	return (
		<PanelBody
			className="block-editor-block-inspector__effects"
			title={ __( 'Effects' ) }
			initialOpen
		>
			<ToggleGroupControl
				className="block-editor-hooks__flex-layout-orientation-controls"
				label={ __( 'Entrance effect' ) }
				value={ effect }
				onChange={ ( value ) =>
					updateBlockAttributes( clientId, { effect: value } )
				}
			>
				{ effectsOptions.map( ( option ) => (
					<ToggleGroupControlOptionIcon
						key={ option.value }
						{ ...option }
						showTooltip
					/>
				) ) }
			</ToggleGroupControl>
		</PanelBody>
	);
}
