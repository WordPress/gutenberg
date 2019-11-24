/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useBlockEditContext } from '../block-edit';
import { __experimentalUseGradient } from '../gradients';
import { __experimentalUseColors } from '../colors';
import BackgroundControls from './controls';
import { ALLOWED_MEDIA_TYPES } from './shared';
import DefaultBackgroundPicker from './default-background-picker';
import BlockBackgroundUi from './block-background-ui';
import onSelectMedia from './on-select-media';

export default function WithBackgroundControls( {
	showDefaultPicker,
	blockIcon,
	blockLabel,
	className,
	children,
	isSelected,
} ) {
	const { clientId } = useBlockEditContext();
	const { attributes } = useSelect(
		( select ) => {
			const { getBlockAttributes } = select( 'core/block-editor' );
			return {
				attributes: getBlockAttributes( clientId ),
			};
		},
		[ clientId ]
	);
	const { updateBlockAttributes, toggleSelection } = useDispatch( 'core/block-editor' );
	const setAttributes = useCallback(
		( newAttributes ) => updateBlockAttributes( clientId, newAttributes ),
		[ updateBlockAttributes, clientId ]
	);

	const { url } = attributes;

	const {
		gradientClass,
		gradientValue,
		setGradient,
	} = __experimentalUseGradient();

	// @TODO: Use Controls from here.
	const { OverlayColor } = __experimentalUseColors( [ {
		name: 'overlayColor',
		property: 'background-color',
	} ] );

	const overlayColor = OverlayColor.color;
	const setOverlayColor = OverlayColor.setColor;
	// debugger;

	const selectMedia = onSelectMedia( setAttributes );

	const hasBackground = !! ( url || overlayColor || gradientValue );

	const [ temporaryMinHeight, setTemporaryMinHeight ] = useState( null );

	const controls = <BackgroundControls
		attributes={ attributes }
		setAttributes={ setAttributes }
		hasBackground={ hasBackground }
		overlayColor={ overlayColor }
		setOverlayColor={ setOverlayColor }
		gradientValue={ gradientValue }
		setGradient={ setGradient }
		onSelectMedia={ selectMedia }
		allowedMediaTypes={ ALLOWED_MEDIA_TYPES }
		temporaryMinHeight={ temporaryMinHeight }
	/>;

	if ( ! hasBackground && showDefaultPicker ) {
		return (
			<>
				{ controls }
				<DefaultBackgroundPicker
					icon={ blockIcon }
					label={ blockLabel }
					onSelectMedia={ selectMedia }
					allowedMediaTypes={ ALLOWED_MEDIA_TYPES }
					className={ className }
					overlayColor={ overlayColor }
					setOverlayColor={ setOverlayColor }
					setGradient={ setGradient }
					setAttributes={ setAttributes }
					gradientValue={ gradientValue }
				/>;
			</>
		);
	}

	const background = <BlockBackgroundUi
		className={ className }
		children={ children }
		attributes={ attributes }
		isSelected={ isSelected }
		toggleSelection={ toggleSelection }
		setAttributes={ setAttributes }
		overlayColor={ overlayColor }
		gradientValue={ gradientValue }
		temporaryMinHeight={ temporaryMinHeight }
		setTemporaryMinHeight={ setTemporaryMinHeight }
		gradientClass={ gradientClass }
	/>;

	return (
		<OverlayColor>
			{ controls }
			{ background }
		</OverlayColor>
	);
}
