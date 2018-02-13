# @wordpress/autop

JavaScript port of WordPress's automatic paragraph function `autop` and the `removep` reverse behavior.

## Installation

Install the module

```bash
npm install @wordpress/autop --save
```

### Usage

Import the desired function(s) from `@wordpress/autop`:

```js
import { autop, removep } from '@wordpress/autop';

autop( 'my text' );
// "<p>my text</p>"

removep( '<p>my text</p>' );
// "my text"
```

### API Usage

* `autop( text: string ): string`
* `remove( text: string ): string`

<br/><br/>![Code is Poetry.](https://cldup.com/ZdtsUVg_V3.png)
