const v1 = {
	attributes: {
		textAlign: {
			type: 'string',
		},
		averageReadingSpeed: {
			type: 'number',
		},
	},
	save() {
		return null;
	},
	migrate( attributes ) {
		return {
			...attributes,
			displayAsRange: false,
		};
	},
	isEligible( attributes ) {
		return (
			attributes.displayAsRange === undefined &&
			attributes.averageReadingSpeed === undefined
		);
	},
};

export default [ v1 ];
