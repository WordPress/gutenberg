Set.prototype.difference = function( nextSet ) {
	// creating new set to store difference
	const differenceSet = new Set();

	// iterate over the values
	for ( const elem of this ) {
		// if the value[i] is not present
		// in nextSet add to the differenceSet
		if ( ! nextSet.has( elem ) ) {
			differenceSet.add( elem );
		}
	}

	// returns values of differenceSet
	return differenceSet;
};

export default class Block {
	constructor() {
		this.accessibilityIdKey = 'name';
		this.defaultPlatform = 'android';

		this.rnPlatform = process.env.TEST_RN_PLATFORM || this.defaultPlatform;
		if ( this.rnPlatform === 'android' ) {
			this.accessibilityIdKey = 'content-desc';
		}
	}

	async typeString( element, str ) {
		if ( this.rnPlatform === 'android' ) {
			await element.clear();
			return await element.type( str );
		}
		// iOS: Problem with Appium type function needing to be cleared after first attempt
		// Requiring me to do a little hacking to get it work
		await element.clear();
		await element.type( ' '.repeat( str.length * 2 ) );
		await element.clear();
		return await element.type( str );
	}
}
