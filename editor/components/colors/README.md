# Colors

In this folder, we implement a withColors HOC and a set of functions that handle color logic and color generation for the blocks.

When blocks allow the user to configure colors of their UI, ideally inline styles should be avoided for the predefined colors in the palette.
Blocks can take advantage of the withColors HOC to avoid inline styles. To do that blocks should have an attribute for the predefined colors ( e.g: backgroundColor ) and an attribute for the custom colors ( e.g: customBackgroundColor ) per color they use.

When colors are set on the predefined color attribute, it means that the color being used is a predefined color and no inline styles will be used on the front end, a predefined class will be used.
If the color is a custom one it should be set on the custom color attribute.
The predefined color attribute contains a string that uniquely identifies the color and that string is used during the class generation e.g.: 'vivid-red', 'theme-x-main-color'.
The custom color attribute contains a color code e.g: #ff0000.

When using colors in different places we may need different styles/classes to set those colors ( e.g: to set a background color we use 'background-color: #color' to set a text color we use 'color: #color' ).
In order for the editor to know which class to use we have the concept of context.
Context represents the type of styles needed to set a color e.g: 'background-color', or 'color'.
The class name is build using 'has-' followed by the color identifier present in the color attribute and ending with the context e.g.: 'has-vivid-red-background-color'.

The logic to know from the color attribute, and custom color attribute what is the color value, what is the color class, or to given a color value set the color would be equal to all the blocks using colors (e.g., given a color value we need to check if a predefined color for this value exist and if yes we set a color in color identifier attribute if not we set a color in the custom color attribute this is common to all blocks). 

To avoid code duplication, the withColor HOC was created. The HOC should be used to wrap the block edit component.
Given the color attributes and context, withColor HOC generates an object with the information about that color (e.g: value, class, etc..) and a function that receives the color value and handles changing the attributes.

withColors HOC can receive multiple arguments. Each argument of the withColors HOC can be a string or an object.
If the argument is an object, it should just contain one key with a value.
The key should be the name of attribute where predefined colors are set e.g.: 'textColor'.
The value should be the context where this color is used e.g.: 'color'.
withColors HOC assumes the custom colors of this type are saved in an attribute with the name 'custom' followed by the name used for predefined colors with the first letter capitalized. 
If the argument of the withColors HOC is a string, it should contain the name of the attribute where predefined colors are saved, e.g.: 'backgroundColor'. The name of the attributes where custom colors are saved is computed following the same logic specified before.
The context where the color is used is computed applying a [kebabCase transform](https://lodash.com/docs/4.17.10#kebabCase) on the predefined color attribute (e.g: 'backgroundColor becomes background-color' ).

For each argument, the withColors HOC generates two additional props. A color object property with the same name as the predefined color attribute e.g: backgroundColor. And a setter function whose name is computed using 'set' followed by the name used for predefined colors with the first letter capitalized.
The color object contains an object with two main properties:
    - class: contains the class used to represent the color if one exists
    - value: contains the color value if a color was set.

The setter is a function that receives the color value and handles all the attribute changes required to set that color.
 

## Sample

To make things easier to understand bellow we provide a sample of complete block making use of the abstractions offered in this folder:

```js
( function() {
    var registerBlockType = wp.blocks.registerBlockType;
    var el = wp.element.createElement;
    var Fragment = wp.element.Fragment;
    var InnerBlocks = wp.editor.InnerBlocks;
    var PanelColor = wp.editor.PanelColor;
    var withColors = wp.editor.withColors;getColorClass
    var InspectorControls = wp.editor.InspectorControls;
    var getColorClass = wp.editor.getColorClass;
    var __ = wp.i18n.__;

    registerBlockType( 'block/inner-block-transforms', {
        title: 'Hello world',
        icon: 'carrot',
        category: 'common',
        attributes: {
            backgroundColor: {
                type: 'string',
            },
            textColor: {
                type: 'string',
            },
            customBackgroundColor: {
                type: 'string',
            },
            customTextColor: {
                type: 'string',
            },
        },

        edit: withColors( 'backgroundColor', { textColor: 'color' } )( 
            function( props ) {
                // Props added by withColors HOC.
                var backgroundColor = props.backgroundColor;
                var setBackgroundColor = props.setBackgroundColor;
                var textColor = props.textColor;
                var setTextColor = props.setTextColor;

                // Class computation
                var paragraphClasses = (
                    ( backgroundColor.class || '' ) + '' + ( textColor.class || '' )
                ).trim();

                return el( Fragment, {},
                    el( 'p', {
                        className: paragraphClasses,
                        style: {
                            backgroundColor: backgroundColor.value,
                            color: textColor.value,
                        }
                    },
                        'Hello world'
                    ),
                    el( InspectorControls, {},
                        el( PanelColor, {
                            colorValue: backgroundColor.value,
                            title: __( 'Background Color' ),
                            onChange: setBackgroundColor,
                        } ),
                        el( PanelColor, {
                            colorValue: textColor.value,
                            title: __( 'Text Color' ),
                            onChange: setTextColor,
                        } )
                    )
                );
            }
        ),

        save: function( props ) {
            var attributes = props.attributes;

            // Compute each class.
            var textClass = getColorClass( 'color', attributes.textColor );
            var backgroundClass = getColorClass( 'background-color', attributes.backgroundColor );

            // Compute the string with all classes concatenated.
            var paragraphClasses = (
                ( backgroundClass || '' ) + '' + ( textClass || '' )
            ).trim();

            // compute the inline styles.
            // On save they should only be set if no classes that represent the colors exist.
            var paragraphStyles = {
                backgroundColor: backgroundClass ? undefined : attributes.customBackgroundColor,
                color: textClass ? undefined : attributes.customTextColor,
            };

            return el( 'p', {
                className: paragraphClasses,
                style: paragraphStyles,
            },
                'Hello world'
            );
        },
    } );
} )();
```
