const styles = new Proxy(
	{},
	{
		get( target, property ) {
			if ( property === '__esModule' ) {
				return false;
			}

			if ( typeof property === 'symbol' ) {
				return target[ property ];
			}

			return property;
		},
	}
);

module.exports = styles;
