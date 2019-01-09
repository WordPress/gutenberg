# Format library

Format library for the WordPress editor.

## Installation

Install the module

```bash
npm install @wordpress/format-library --save
```

_This package assumes that your code will run in an **ES2015+** environment. If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods. Learn more about it in [Babel docs](https://babeljs.io/docs/en/next/caveats)._

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>

## Extensibility

### Link settings

You can extend the link settings by creating a Fill with the name `LinkSettings`. This fill will receive the following props allowing you to edit the link's attributes:

#### setLinkAttributes( newAttributes )

Callback function you can use to overwrite the link's attributes. Expects an object containing the new attributes.

**Important:** This will completely overwrite the link's attributes, so it is up to the developer to properly merge the current attributes with the attributes that the newly added option is trying to introduce. For example, notice how the rel attribute is merged in the included example.

#### attributes

Object containing the link's current attributes.

#### url

The link URL.

#### text

The link text.

### Example

```js
class NoFollowToggle extends Component {

	isChecked() {
		const { rel } = this.props.attributes;

		if ( ! rel ) {
			return false;
		}

		return rel.split( ' ' ).includes( 'nofollow' );
	}

	toggle() {
		const { setLinkAttributes, attributes } = this.props;

		const rel = attributes.rel;

		if ( this.isChecked() ) {
			if ( ! rel ) {
				return;
			}

			const newRel = rel.split( ' ' ).filter( ( relItem ) => {
				return relItem !== 'nofollow';
			} ).join( ' ' );

			setLinkAttributes( {
				...attributes,
				rel: newRel,
			} );
			return;
		}

		if ( ! rel ) {
			setLinkAttributes( {
				...attributes,
				rel: 'nofollow',
			} );
		} else {
			setLinkAttributes( {
				...attributes,
				rel: [ rel, 'nofollow' ].join( ' ' ),
			} );
		}
	}

	render() {
		return (
			<ToggleControl
				label={ 'No Follow' }
				checked={ this.isChecked() }
				onChange={ this.toggle.bind( this ) }
			/>
		);
	}
}

function NoFollowToggleWrapper() {
	return (
		<Fill name="LinkSettings">
			{ ( props ) => {
				return <NoFollowToggle { ...props } />;
			} }
		</Fill>
	);
}
```
