/**
 * WordPress dependencies
 */
import {
	__experimentalFontAppearanceControl as FontAppearanceControl,
	__experimentalFontFamilyControl as FontFamilyControl,
	__experimentalLetterSpacingControl as LetterSpacingControl,
	LineHeightControl,
} from '@wordpress/block-editor';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import FontSizePicker from '../../font-size-picker';
import Panel from '../../panel';
import {
	ToggleGroupControl,
	ToggleGroupControlOption,
} from '../../toggle-group-control';
import { ToolsPanel, ToolsPanelItem } from '..';

// These options match the theme.json typography schema
const fontFamilies = [
	{
		fontFamily:
			'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
		slug: 'system-fonts',
		name: 'System Fonts',
	},
	{
		fontFamily:
			'Consolas, "Andale Mono WT", "Andale Mono", "Lucida Console", "Lucida Sans Typewriter", "DejaVu Sans Mono", "Bitstream Vera Sans Mono", "Liberation Mono", "Nimbus Mono L", Monaco, "Courier New", Courier, monospace',
		name: 'Monospace',
		slug: 'monospace',
	},
	{
		fontFamily:
			'Hoefler Text, Baskerville Old Face, Garamond, Times New Roman, serif',
		name: 'Serif',
		slug: 'hoefler-times-new-roman',
	},
];
const fontSizes = [
	{
		slug: 'small',
		size: '1rem',
		name: 'Small',
	},
	{
		slug: 'normal',
		size: '1.25rem',
		name: 'Normal',
	},
	{
		slug: 'medium',
		size: '1.5rem',
		name: 'medium',
	},
	{
		slug: 'large',
		size: '2rem',
		name: 'Large',
	},
	{
		slug: 'extra-large',
		size: '3rem',
		name: 'Extra large',
	},
];

const LetterCaseControl = ( props ) => {
	return (
		<ToggleGroupControl label="Letter Case" isBlock={ true } { ...props }>
			{ [
				{ value: 'uppercase', ariaLabel: 'Uppercase', label: 'AB' },
				{ value: 'lowercase', ariaLabel: 'Lowercase', label: 'ab' },
				{ value: 'capitalize', ariaLabel: 'Capitalize', label: 'Ab' },
			].map( ( { value, ariaLabel, label } ) => (
				<ToggleGroupControlOption
					key={ value }
					label={ label }
					aria-label={ ariaLabel }
					value={ value }
				/>
			) ) }
		</ToggleGroupControl>
	);
};

export const TypographyPanel = () => {
	const [ fontFamily, setFontFamily ] = useState();
	const [ fontSize, setFontSize ] = useState();
	const [ fontWeight, setFontWeight ] = useState();
	const [ fontStyle, setFontStyle ] = useState();
	const [ lineHeight, setLineHeight ] = useState();
	const [ letterSpacing, setLetterSpacing ] = useState();
	const [ textTransform, setTextTransform ] = useState();

	return (
		<>
			<div style={ { maxWidth: '280px' } }>
				<Panel>
					<ToolsPanel label="Typography">
						<ToolsPanelItem
							hasValue={ () => !! fontFamily }
							label="Font"
							onDeselect={ () => setFontFamily( undefined ) }
							isShownByDefault={ true }
						>
							<FontFamilyControl
								value={ fontFamily }
								onChange={ setFontFamily }
								fontFamilies={ fontFamilies }
							/>
						</ToolsPanelItem>

						<ToolsPanelItem
							hasValue={ () => !! fontSize }
							label="Size"
							onDeselect={ () => setFontSize( undefined ) }
							isShownByDefault={ true }
						>
							<FontSizePicker
								value={ fontSize }
								onChange={ setFontSize }
								fontSizes={ fontSizes }
							/>
						</ToolsPanelItem>

						<ToolsPanelItem
							hasValue={ () => !! fontStyle || !! fontWeight }
							label="Appearance"
							onDeselect={ () => {
								setFontStyle( undefined );
								setFontWeight( undefined );
							} }
							isShownByDefault={ true }
						>
							<FontAppearanceControl
								value={ {
									fontStyle,
									fontWeight,
								} }
								onChange={ ( {
									fontStyle: style,
									fontWeight: weight,
								} ) => {
									setFontStyle( style );
									setFontWeight( weight );
								} }
							/>
						</ToolsPanelItem>

						<ToolsPanelItem
							hasValue={ () => !! lineHeight }
							label="Line Height"
							onDeselect={ () => setLineHeight( undefined ) }
							isShownByDefault={ true }
						>
							<LineHeightControl
								value={ lineHeight }
								onChange={ setLineHeight }
							/>
						</ToolsPanelItem>

						<ToolsPanelItem
							hasValue={ () => !! letterSpacing }
							label="Letter Spacing"
							onDeselect={ () => setLetterSpacing( undefined ) }
							isShownByDefault={ true }
						>
							<LetterSpacingControl
								value={ letterSpacing }
								onChange={ setLetterSpacing }
							/>
						</ToolsPanelItem>

						<ToolsPanelItem
							hasValue={ () => !! textTransform }
							label="Letter Case"
							onDeselect={ () => setTextTransform( undefined ) }
							isShownByDefault={ true }
						>
							<LetterCaseControl
								onChange={ setTextTransform }
								value={ textTransform }
							/>
						</ToolsPanelItem>
					</ToolsPanel>
				</Panel>
			</div>
			<div
				style={ {
					marginTop: '1rem',
					fontFamily,
					fontSize,
					fontStyle,
					fontWeight,
					lineHeight,
					letterSpacing,
					textTransform,
				} }
			>
				Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do
				eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
				enim ad minim veniam, quis nostrud exercitation ullamco laboris
				nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor
				in reprehenderit in voluptate velit esse cillum dolore eu fugiat
				nulla pariatur. Excepteur sint occaecat cupidatat non proident,
				sunt in culpa qui officia deserunt mollit anim id est laborum.
			</div>
		</>
	);
};
