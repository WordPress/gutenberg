// @ts-expect-error: Not typed yet.
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { useStyle, useSetting, useStyleWithResolvedBackground } from './hooks';
import { unlock } from './lock-unlock';

// Initial control values where no block style is set.
const BACKGROUND_DEFAULT_VALUES = {
	backgroundSize: 'auto',
};

const { BackgroundPanel: StylesBackgroundPanel } = unlock(
	blockEditorPrivateApis
);

/**
 * Checks if there is a current value in the background image block support
 * attributes.
 *
 * @param style Style attribute.
 * @return Whether the block has a background image value set.
 */
export function hasBackgroundImageValue( style: any ): boolean {
	return (
		!! style?.background?.backgroundImage?.id ||
		!! style?.background?.backgroundImage?.url ||
		typeof style?.background?.backgroundImage === 'string'
	);
}

export default function BackgroundPanel() {
	const [ style ] = useStyle( '', undefined, 'user', false );
	const [ inheritedStyle, setStyle ] = useStyle(
		'',
		undefined,
		'merged',
		false
	);
	const resolvedInheritedStyle =
		useStyleWithResolvedBackground( inheritedStyle );
	const [ settings ] = useSetting( '' );

	return (
		<StylesBackgroundPanel
			inheritedValue={ resolvedInheritedStyle }
			value={ style }
			onChange={ setStyle }
			settings={ settings }
			defaultValues={ BACKGROUND_DEFAULT_VALUES }
			showInheritanceLabelIndicators={ false }
		/>
	);
}
