// @ts-expect-error: Not typed yet.
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { useStyle, useSetting } from './hooks';
import { unlock } from './lock-unlock';

const { useSettingsForBlockElement, TypographyPanel: StylesTypographyPanel } =
	unlock( blockEditorPrivateApis );

interface TypographyPanelProps {
	element: string;
	headingLevel: string;
	showTextColor?: boolean;
}

export default function TypographyPanel( {
	element,
	headingLevel,
	showTextColor = true,
}: TypographyPanelProps ) {
	let prefixParts: string[] = [];
	if ( element === 'heading' ) {
		prefixParts = prefixParts.concat( [ 'elements', headingLevel ] );
	} else if ( element && element !== 'text' ) {
		prefixParts = prefixParts.concat( [ 'elements', element ] );
	}
	const prefix = prefixParts.join( '.' );

	const [ style ] = useStyle( prefix, '', 'user', false );
	const [ inheritedStyle, setStyle ] = useStyle(
		prefix,
		'',
		'merged',
		false
	);
	const [ rawSettings ] = useSetting( '' );
	const usedElement = element === 'heading' ? headingLevel : element;
	const elementSettings = useSettingsForBlockElement(
		rawSettings,
		undefined,
		usedElement
	);
	const settings = showTextColor
		? elementSettings
		: {
				...elementSettings,
				color: {
					...elementSettings.color,
					text: false,
				},
		  };

	return (
		<StylesTypographyPanel
			inheritedValue={ inheritedStyle }
			value={ style }
			onChange={ setStyle }
			settings={ settings }
			showInheritanceLabelIndicators={ false }
		/>
	);
}
