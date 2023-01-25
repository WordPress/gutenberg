/**
 * WordPress dependencies
 */
import { experiments as blockEditorExperiments } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../experiments';

const {
	useGlobalStyle,
	useGlobalSetting,
	TypographyPanel: StylesTypographyPanel,
} = unlock( blockEditorExperiments );

export default function TypographyPanel( {
	name,
	element,
	headingLevel,
	variation = '',
} ) {
	let prefix = '';
	if ( element === 'heading' ) {
		prefix = `elements.${ headingLevel }.`;
	} else if ( element && element !== 'text' ) {
		prefix = `elements.${ element }.`;
	}
	if ( variation ) {
		prefix = prefix
			? `variations.${ variation }.${ prefix }`
			: `variations.${ variation }`;
	}

	const [ style ] = useGlobalStyle( prefix, name, 'user', false );
	const [ inheritedStyle, setStyle ] = useGlobalStyle(
		prefix,
		name,
		'all',
		false
	);
	const [ settings ] = useGlobalSetting( '', name );

	return (
		<StylesTypographyPanel
			name={ name }
			element={ element === 'heading' ? headingLevel : element }
			inherit={ inheritedStyle }
			value={ style }
			onChange={ setStyle }
			settings={ settings }
		/>
	);
}
