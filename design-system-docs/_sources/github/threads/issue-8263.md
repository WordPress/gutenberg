---
number: 8263
type: issue
state: CLOSED
url: https://github.com/WordPress/gutenberg/issues/8263
matched_labels: ["[Package] Components"]
all_labels: ["[Type] Bug","[Package] Components"]
---

# Issue #8263: Color picker inside a modal components goes below the modal dialog

- URL: https://github.com/WordPress/gutenberg/issues/8263
- Author: hos-shams
- Created: 2018-07-28T14:14:26Z
- Updated: 2020-04-21T03:31:49Z
- Comments: 9 of 9

## Body

If you put a ColorPalette component inside a Modal component, once you click on the "Custom color picker" button, the color picker displays below the modal dialog.

![color-picker-zindex](https://user-images.githubusercontent.com/1919575/43357343-305ffb42-923d-11e8-81a7-7a46f72b7a4c.png)

**To Reproduce**
Here's a simple block to demonstrate this issue:

```javascript
const { Fragment } = wp.element;
const { PanelBody, Modal, ColorPalette } = wp.components;
const { InspectorControls, RichText } = wp.editor;
const { __ } = wp.i18n;
const { registerBlockType } = wp.blocks;

registerBlockType( 'thesaas/issues', {
  title: __( 'Issues' ),
  icon: 'universal-access-alt',

  edit() {
    return (
      <Fragment>
        <InspectorControls>
          <PanelBody title={ __( 'Panel' ) }>
            <Modal title="My Modal">
              <ColorPalette />
            </Modal>
          </PanelBody>
        </InspectorControls>

        <div>None</div>
      </Fragment>
    );
  },

  save() {
    return <div>None</div>;
  },
} );
```

## Issue comments

### hos-shams on 2018-08-21T15:53:07Z

URL: https://github.com/WordPress/gutenberg/issues/8263#issuecomment-414724735

Still exists in the latest release which is v3.6.2 ...

P.S. @designsimply , I guess you should add "[Type] Bug" instead of "[Type] Help Request".

### designsimply on 2019-01-28T20:03:20Z

URL: https://github.com/WordPress/gutenberg/issues/8263#issuecomment-458280365

Sorry for not catching back up with this one sooner! I have updated the labels and appreciate the nudge.

### designsimply on 2019-01-28T20:05:34Z

URL: https://github.com/WordPress/gutenberg/issues/8263#issuecomment-458281164

@ShaMSofT am I reading this correctly that it is only a problem when creating a custom modal component with a color picker inside it? I ask because I was trying to think of a place where I could test it in the plugin directly without custom code but I can't think of a spot that has a color picker inside a modal.

### hos-shams on 2019-02-01T03:57:52Z

URL: https://github.com/WordPress/gutenberg/issues/8263#issuecomment-459597440

@designsimply probably only Modal and [Dropdown](https://wordpress.org/gutenberg/handbook/designers-developers/developers/components/dropdown/), because I don't have such an issue in block settings panel. I haven't tried it with Modal in past months, but a similar problem exist if I put the ColorPalette inside a Dropdown component. It goes below the Dropdown and if I click on the color value input, both the Dropdown and ColorPalette close. I guess that's because of a click outside of Dropdown area.

See the GIF for better understanding.
![dropdown-color-palette](https://user-images.githubusercontent.com/1919575/52101887-9cb12080-25ab-11e9-949a-df57c18193b0.gif)

### AbanobAkram on 2019-06-27T16:28:30Z

URL: https://github.com/WordPress/gutenberg/issues/8263#issuecomment-506418280

@ShaMSofT Have you found any workaround for this issue ?

### hos-shams on 2019-07-01T16:11:58Z

URL: https://github.com/WordPress/gutenberg/issues/8263#issuecomment-507330217

@AbanobAkram No.

### alpezed on 2019-08-02T06:17:00Z

URL: https://github.com/WordPress/gutenberg/issues/8263#issuecomment-517567935

The same issue here, both the Dropdown and ColorPalette close if I click on the ColorIndicator and color value.

https://www.loom.com/share/385fa939fcdd42c9809dd97c0bd24ba0

### rmorse on 2019-11-20T14:17:46Z

URL: https://github.com/WordPress/gutenberg/issues/8263#issuecomment-556022303

It seems it's just z-index issues..  This CSS "fixed" it for me:

    .components-popover {
    	z-index: auto;
    }
    .components-popover.components-color-palette__picker{
    	z-index: 100001;
    }


But I also noticed some odd behaviour in terms of clicking outside and the ColorPicker not going away... 

So, I'm resorting to using the ColorPalette with 

    disableCustomColors = {true}

And then adding in a ColorPicker and wrapping that in a new component with some sort of auto hide on click outside for the ColorPicker.

### tellthemachines on 2020-04-21T03:31:49Z

URL: https://github.com/WordPress/gutenberg/issues/8263#issuecomment-616931133

I can no longer reproduce this issue with a `ColorPalette` inside a `Modal` or a `Dropdown`. Closing as it seems to be fixed; feel free to reopen if it's still an issue.

