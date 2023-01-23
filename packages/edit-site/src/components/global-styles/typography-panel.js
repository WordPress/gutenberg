/**
 * WordPress dependencies
 */
import { experiments as blockEditorExperiments } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../experiments';

const { useGlobalStyle, TypographyPanel: StylesTypographyPanel } = unlock(
	blockEditorExperiments
);

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
	const [ style, setStyle ] = useGlobalStyle( prefix, name );
	const [ inheritedStyle ] = useGlobalStyle( prefix, name, 'user' );

	return (
		<StylesTypographyPanel
			inherit={ inheritedStyle }
			value={ style }
			onChange={ setStyle }
			name={ name }
			element={ element === 'heading' ? headingLevel : element }
		/>
	);
}
