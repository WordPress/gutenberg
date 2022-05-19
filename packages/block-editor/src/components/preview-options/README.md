# Preview Options

The `PreviewOptions` component displays the list of different preview options available in the editor.

It returns a [`DropdownMenu`](https://github.com/WordPress/gutenberg/tree/HEAD/packages/components/src/dropdown-menu) component with these different options. The options currently available in the editor are Desktop, Mobile, Tablet and "Preview in new tab".

![Preview options dropdown menu](https://make.wordpress.org/core/files/2020/09/preview-options-dropdown-menu.png)

## Table of contents

1. [Development guidelines](#development-guidelines)
2. [Related components](#related-components)

## Development guidelines

### Usage

Renders the previews options of the editor in a dropdown menu.

```jsx
import { Icon, MenuGroup } from '@wordpress/components';
import { PostPreviewButton } from '@wordpress/editor';
import { __experimentalPreviewOptions as PreviewOptions } from '@wordpress/block-editor';

const MyPreviewOptions = () => (
	<PreviewOptions
		isEnabled={ true }
		className="edit-post-post-preview-dropdown"
		deviceType={ deviceType }
		setDeviceType={ setPreviewDeviceType }
	>
		<MenuGroup>
			<div className="edit-post-header-preview__grouping-external">
				<PostPreviewButton
					className={ 'edit-post-header-preview__button-external' }
					role="menuitem"
					forceIsAutosaveable={ hasActiveMetaboxes }
					forcePreviewLink={ isSaving ? null : undefined }
					textContent={
						<>
							{ __( 'Preview in new tab' ) }
							<Icon icon={ external } />
						</>
					}
				/>
			</div>
		</MenuGroup>
	</PreviewOptions>
);
```

### Props

#### className

The CSS classes added to the component.

-   Type: `String`
-   Required: no

#### isEnabled

Wheter or not the preview options are enabled for the current post.
And example of when the preview options are not enabled is when the current post is not savable.

-   Type: `boolean`
-   Required: no
-   Default: true

#### deviceType

The device type in the preview options. It can be either Desktop or Tablet or Mobile among others.

-   Type: `String`
-   Required: yes

#### setDeviceType

Used to set the device type that will be used to display the preview inside the editor.

-   Type: `func`
-   Required: yes

## Related components

Block Editor components are components that can be used to compose the UI of your block editor. Thus, they can only be used under a [`BlockEditorProvider`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/provider/README.md) in the components tree.
