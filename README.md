# Gutenberg by Front

Gutenberg by Front could be used as a package of your project. 

## Usage

```
npm install @frontkom/gutenberg
```

Check the package [documentation](https://www.npmjs.com/package/@frontkom/gutenberg).

## Publishing

Don't forget to update the package version in `package.dist.json` file. To prepare the package run the following command from the root:

```
npm run build-package
```

It will run lint, generate the `dist` files and add the `package.json` and `README.md` files to the package folder (`gutenberg-package`).

Finally, you can publish the package! Go to the `gutenberg-package` folder and run the following command (*Note* you have to be [logged in](https://docs.npmjs.com/cli/adduser)):

```
npm publish --access=public
```

Additionaly, you can add `--tag=beta` option.
