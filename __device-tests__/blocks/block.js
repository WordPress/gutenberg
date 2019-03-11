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
	constructor( driver ) {
		this.driver = driver;
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
		// iOS: Problem with Appium type function Requiring me to do a little hacking to get it work,
		// as a result typing on iOS will be slower
		for ( let i = 0; i < str.length; i++ ) {
			await element.type( str.charAt( i ) );
		}
	}
}
