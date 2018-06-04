# Gutenberg by Front

Now you can use [Wordpress/Gutenberg](https://github.com/WordPress/gutenberg) as a package of your project!

## Usage

```
npm install @frontkom/gutenberg
```

Check the package [documentation](https://www.npmjs.com/package/@frontkom/gutenberg).

## Development

During the development you can use `npm link` to link this package and test it without having to publish it. 

From the package folder (`packages/gutenberg`) run `npm link` to create the link. Then in project folder which has the package as dependency, run `npm link @frontkom/gutenberg` so the package could be linked. 

Now all changes you made on package will be watched.

## Publishing

Don't forget to update the package version in `packages/gutenberg/package.json` file. To prepare the package run the following command from the root:

```
npm run prepublish
```

It will run lint, generate the `build` files in the package folder (`packages/gutenberg`).

Finally, you can publish the package! Go to the `packages/gutenberg` folder and run the following command (*Note* you have to be [logged in](https://docs.npmjs.com/cli/adduser)):

```
npm publish
```

Additionaly, you can add `--tag=beta` option.
