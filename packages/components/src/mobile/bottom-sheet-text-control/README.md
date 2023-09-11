# BottomSheetTextControl

`BottomSheetTextControl` allows users to enter and edit text, similar to [`TextControl`](/packages/components/src/text-control/README.md).

`BottomSheetTextControl`'s main difference from `TextControl` is that it utilizes [`BottomSheetSubSheet`](/packages/components/src/mobile/bottom-sheet/sub-sheet/README.md). A user will tap to open a subsheet where they can enter their text into an editor. This is useful for cases where a larger text area is warranted for user input.

### Usage

```jsx
// This is a paraphrased example from the image block's edit.native.js file
import {
	BottomSheetSelectControl,
	FooterMessageLink,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const MyTextControl = () => {
	const {
		attributes: { alt },
	} = this.props;

	const updateAlt = ( newAlt ) => {
		this.props.setAttributes( { alt: newAlt } );
	};

	return (
		<PanelBody>
			<BottomSheetTextControl
				initialValue={ alt }
				onChange={ updateAlt }
				placeholder={ __( 'Generic placeholder text' ) }
				label={ __( 'Generic label' ) }
				icon={ textColor }
				footerNote={
					<>
						{ __( 'A footer note to add to the component! ' ) }
						<FooterMessageLink
							href={ 'https://wordpress.org/' }
							value={ __( 'Visit WordPress.org' ) }
						/>
					</>
				}
			/>
		</PanelBody>
	);
};
```

### Props

#### initialValue

The initial value of the input.

-   Type: `String`
-   Required: Yes

#### onChange

A function that receives the value that's input into the text editor.

-   Type: `Function`
-   Required: Yes

#### placeholder

The placeholder text that will display in the component's cell and subsheet when there is no set value.

-   Type: `String`
-   Required: No

### cellPlaceholder

The placeholder text that will display in the component's cell when there is no set value. The `cellPlaceholder` will override the more generic placeholder prop when set, enabling the placeholders in the component's cell and subsheet to be different if desired.

-   Type: `String`
-   Required: No

#### label

The label for the control. The label will appear in the header area of the subsheet and is necessary for navigation.

-   Type: `String`
-   Required: Yes

#### icon

The icon to display alongside the control.

-   Type: `String`
-   Required: No

#### footerNote

An optional note to display in the component's footer area.

-   Type: `String`
-   Required: No
