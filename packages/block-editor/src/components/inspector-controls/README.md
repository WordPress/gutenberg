# InspectorControls

<img src="https://raw.githubusercontent.com/WordPress/gutenberg/HEAD/docs/assets/inspector.png" with="281" height="527" alt="inspector">

Inspector Controls appear in the post settings sidebar when a block is being edited. The controls appear in both HTML and visual editing modes, and thus should contain settings that affect the entire block.

## Usage

```js
import { registerBlockType } from '@wordpress/blocks';
import {
	CheckboxControl,
	RadioControl,
	TextControl,
	ToggleControl,
	SelectControl,
	PanelBody,
} from '@wordpress/components';
import {
	RichText,
	InspectorControls,
	useBlockProps,
} from '@wordpress/block-editor';

registerBlockType( 'my-plugin/inspector-controls-example', {
	apiVersion: 3,

	title: 'Inspector controls example',

	icon: 'universal-access-alt',

	category: 'design',

	attributes: {
		content: {
			type: 'string',
			source: 'html',
			selector: 'p',
		},
		checkboxField: {
			type: 'boolean',
			default: true,
		},
		radioField: {
			type: 'string',
			default: 'yes',
		},
		textField: {
			type: 'string',
		},
		toggleField: {
			type: 'boolean',
		},
		selectField: {
			type: 'string',
		},
	},

	edit( { attributes, setAttributes } ) {
		const blockProps = useBlockProps();
		const {
			content,
			checkboxField,
			radioField,
			textField,
			toggleField,
			selectField,
		} = attributes;

		function onChangeContent( newContent ) {
			setAttributes( { content: newContent } );
		}

		function onChangeCheckboxField( newValue ) {
			setAttributes( { checkboxField: newValue } );
		}

		function onChangeRadioField( newValue ) {
			setAttributes( { radioField: newValue } );
		}

		function onChangeTextField( newValue ) {
			setAttributes( { textField: newValue } );
		}

		function onChangeToggleField( newValue ) {
			setAttributes( { toggleField: newValue } );
		}

		function onChangeSelectField( newValue ) {
			setAttributes( { selectField: newValue } );
		}

		return (
			<>
				<InspectorControls>
					<PanelBody title={ __( 'Settings' ) }>
						<CheckboxControl
							__nextHasNoMarginBottom
							heading="Checkbox Field"
							label="Tick Me"
							help="Additional help text"
							checked={ checkboxField }
							onChange={ onChangeCheckboxField }
						/>

						<RadioControl
							label="Radio Field"
							selected={ radioField }
							options={ [
								{ label: 'Yes', value: 'yes' },
								{ label: 'No', value: 'no' },
							] }
							onChange={ onChangeRadioField }
						/>

						<TextControl
							__nextHasNoMarginBottom
							__next40pxDefaultSize
							label="Text Field"
							help="Additional help text"
							value={ textField }
							onChange={ onChangeTextField }
						/>

						<ToggleControl
							__nextHasNoMarginBottom
							label="Toggle Field"
							checked={ toggleField }
							onChange={ onChangeToggleField }
						/>

						<SelectControl
							__nextHasNoMarginBottom
							label="Select Control"
							value={ selectField }
							options={ [
								{ value: 'a', label: 'Option A' },
								{ value: 'b', label: 'Option B' },
								{ value: 'c', label: 'Option C' },
							] }
							onChange={ onChangeSelectField }
						/>
					</PanelBody>
				</InspectorControls>

				<RichText
					{ ...blockProps }
					key="editable"
					tagName="p"
					onChange={ onChangeContent }
					value={ content }
				/>
			</>
		);
	},

	save( { attributes } ) {
		const {
			content,
			checkboxField,
			radioField,
			textField,
			toggleField,
			selectField,
		} = attributes;
		const blockProps = useBlockProps.save();

		return (
			<div { ...blockProps }>
				<RichText.Content value={ content } tagName="p" />

				<h2>Inspector Control Fields</h2>
				<ul>
					<li>Checkbox Field: { checkboxField }</li>
					<li>Radio Field: { radioField }</li>
					<li>Text Field: { textField }</li>
					<li>Toggle Field: { toggleField }</li>
					<li>Select Field: { selectField }</li>
				</ul>
			</div>
		);
	},
} );
```

## InspectorAdvancedControls

<img src="https://user-images.githubusercontent.com/150562/94028603-df90bf00-fdb3-11ea-9e6f-eb15c5631d85.png" width="280" alt="inspector-advanced-controls">

Inspector Advanced Controls appear under the _Advanced_ panel of a block's [InspectorControls](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/inspector-controls/README.md) -- that is, they appear as a specific set of controls within a block's settings panels. As the name suggests, `InspectorAdvancedControls` is meant for controls that most users aren't meant to interact with most of the time, such as adding an HTML anchor or custom CSS classes to a block.

### Usage

```js
import { TextControl } from '@wordpress/components';
import {
	InspectorControls,
	InspectorAdvancedControls,
} from '@wordpress/block-editor';

function MyBlockEdit( { attributes, setAttributes } ) {
	return (
		<>
			<div>{ /* Block markup goes here */ }</div>
			<InspectorControls>
				{ /* Regular control goes here */ }
			</InspectorControls>
			<InspectorAdvancedControls>
				<TextControl
					__nextHasNoMarginBottom
					__next40pxDefaultSize
					label="HTML anchor"
					value={ attributes.anchor }
					onChange={ ( nextValue ) => {
						setAttributes( {
							anchor: nextValue,
						} );
					} }
				/>
			</InspectorAdvancedControls>
		</>
	);
}
```
