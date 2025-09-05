/**
 * WordPress dependencies
 */
import {
	ToolbarButton,
	ToolbarGroup,
	Icon,
	Path,
	SVG,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useStylesForBlocks from '../block-styles/use-styles-for-block';
import { replaceActiveStyle } from '../block-styles/utils';
import { store as blockEditorStore } from '../../store';
import { GlobalStylesContext } from '../global-styles';
import { globalStylesDataKey } from '../../store/private-keys';
import { getVariationStylesWithRefValues } from '../../hooks/block-style-variation';

const styleIcon = (
	<SVG
		viewBox="0 0 24 24"
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		aria-hidden="true"
		focusable="false"
	>
		<Path d="M17.2 10.9c-.5-1-1.2-2.1-2.1-3.2-.6-.9-1.3-1.7-2.1-2.6L12 4l-1 1.1c-.6.9-1.3 1.7-2 2.6-.8 1.2-1.5 2.3-2 3.2-.6 1.2-1 2.2-1 3 0 3.4 2.7 6.1 6.1 6.1s6.1-2.7 6.1-6.1c0-.8-.3-1.8-1-3z" />
		<Path
			stroke="currentColor"
			strokeWidth="1.5"
			d="M17.2 10.9c-.5-1-1.2-2.1-2.1-3.2-.6-.9-1.3-1.7-2.1-2.6L12 4l-1 1.1c-.6.9-1.3 1.7-2 2.6-.8 1.2-1.5 2.3-2 3.2-.6 1.2-1 2.2-1 3 0 3.4 2.7 6.1 6.1 6.1s6.1-2.7 6.1-6.1c0-.8-.3-1.8-1-3z"
		/>
	</SVG>
);

function SwitchSectionStyle( { clientId } ) {
	const { stylesToRender, activeStyle, className } = useStylesForBlocks( {
		clientId,
	} );
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	// Get global styles data
	const { merged: mergedConfig } = useContext( GlobalStylesContext );
	const { globalSettings, globalStyles, blockName } = useSelect(
		( select ) => {
			const settings = select( blockEditorStore ).getSettings();
			return {
				globalSettings: settings.__experimentalFeatures,
				globalStyles: settings[ globalStylesDataKey ],
				blockName: select( blockEditorStore ).getBlockName( clientId ),
			};
		},
		[ clientId ]
	);

	// Get the background color for the active style
	const activeStyleBackground = activeStyle?.name
		? getVariationStylesWithRefValues(
				{
					settings: mergedConfig?.settings ?? globalSettings,
					styles: mergedConfig?.styles ?? globalStyles,
				},
				blockName,
				activeStyle.name
		  )?.color?.background
		: undefined;

	if ( ! stylesToRender || stylesToRender.length === 0 ) {
		return null;
	}

	const handleStyleSwitch = () => {
		const currentIndex = stylesToRender.findIndex(
			( style ) => style.name === activeStyle.name
		);

		const nextIndex = ( currentIndex + 1 ) % stylesToRender.length;
		const nextStyle = stylesToRender[ nextIndex ];

		const styleClassName = replaceActiveStyle(
			className,
			activeStyle,
			nextStyle
		);

		updateBlockAttributes( clientId, {
			className: styleClassName,
		} );
	};

	return (
		<ToolbarGroup>
			<ToolbarButton
				onClick={ handleStyleSwitch }
				label={ __( 'Shuffle styles' ) }
			>
				<Icon
					icon={ styleIcon }
					style={ {
						fill: activeStyleBackground || 'transparent',
					} }
				/>
			</ToolbarButton>
		</ToolbarGroup>
	);
}

export default SwitchSectionStyle;
