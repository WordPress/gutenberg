BlockFormatControls
============

`BlockFormatControls` is a slot & fill component that is the basis of all the formats, e.g., bold, italic, link, etc., that appear on the block format toolbar.
Under normal circumstances, the component should not be used directly. When implementing a custom format for the block editor, the API's wp.formatLibrary APIs should be used instead. These API's deal with much of the complexity required for implementing a custom format ( e.g., know which part of the text is selected etc.). `BlockFormatControls` could be considered when there is a need a very custom format with a special UI, and the wp.formatLibrary package does not fit the use-case.

`BlockFormatControls` does not receive any properties and renders the children passed to it, as fills of the format toolbar slot.
E.g: To add a custom button to the format toolbar one can use the following sample:
```jsx
<BlockFormatControls>
    <ToolbarGroup>
        <ToolbarItem>
            { ( toggleProps ) => (
                <DropdownMenu
                    icon={ chevronDown }
                    label={ __(
                        'A new format control'
                    ) }
                    toggleProps={ toggleProps }
                    controls={ controls }
                    popoverProps={ POPOVER_PROPS }
                />
            ) }
        </ToolbarItem>
    </ToolbarGroup>
</BlockFormatControls>
```

Note that the component does not deal with anything related to applying a format. It just renders the children inside the format toolbar.
