This component is used to implement notices in editor.

#### Props

The following props are used to control the display of the component.

* `status`: (string) can be `warning` (red), `success` (green), `error` (red), `info` (yellow)
* `content`: (string) the text of the notice
* `onRemove`: function called when dismissing the notice
* `isDismissible`: (bool) defaults to true, whether the notice should be dismissible or not
