module.exports = {
	defaultValues: {
		slug: 'gutenpride',
		namespace: 'create-block-tutorial-template',
		title: 'Gutenpride',
		description:
			'A Gutenberg block to show your pride! This block enables you to type text and style it with the color font Gilbert from Type with Pride',

		dashicon: 'smiley',
	},
	templatesPath: __dirname,
	assetsPath: require( 'path' ).join( __dirname, 'assets' ),
};
