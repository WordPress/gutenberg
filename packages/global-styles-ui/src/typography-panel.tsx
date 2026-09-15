// @ts-expect-error: Not typed yet.
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { useStyle, useSetting } from './hooks';
import { unlock } from './lock-unlock';

const { useSettingsForBlockElement, TypographyPanel: StylesTypographyPanel } =
	unlock( blockEditorPrivateApis );

interface TypographyPanelProps {
	element: string;
}

export default function TypographyPanel( { element }: TypographyPanelProps ) {
	const prefix = `elements.${ element }`;

	const [ style ] = useStyle( prefix, '', 'user', false );
	const [ inheritedStyle, setStyle ] = useStyle(
		prefix,
		'',
		'merged',
		false
	);
	const [ rawSettings ] = useSetting( '' );
	const settings = useSettingsForBlockElement(
		rawSettings,
		undefined,
		element
	);

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
