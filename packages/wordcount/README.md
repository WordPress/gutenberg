# Word Count

WordPress word count utility.

## Installation

Install the module

```bash
npm install @wordpress/wordcount --save
```

_This package assumes that your code will run in an ES5 environment. If you're using an environment that has limited or no support for ES5 such as lower versions of IE then using [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods. Learn more about it in [Babel docs](https://babeljs.io/docs/en/next/caveats)._

## Accepted Paramaters

```JS
count( text, type, userSettings )
````
count accepts three parameters:
1. text: A string containing the words/characters to be counted.
2. type: A string that represents the type of count. The current implementation accepts the strings 'words', 'characters_excluding_spaces', or 'characters_including_spaces'.
3. userSettings: An object that contains the list of regular expressions that will be used to count. See defaultSettings.js for the defaults.

## Usage

```JS
import { count } from '@wordpress/wordcount';
const numberOfWords = count( 'Words to count', 'words', {} )
