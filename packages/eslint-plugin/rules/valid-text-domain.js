const STATUS = {
	MISSING: 'missing',
	INVALID_VALUE: 'invalid-domain',
	INVALID_TYPE: 'invalid-type',
	VALID: 'valid',
};

function validateTextDomain( functionName, args, allowedTextDomains ) {
	switch ( functionName ) {
		case '__':
			if ( args.length < 2 ) {
				return STATUS.MISSING;
			}
			break;
		case '_x':
			if ( args.length < 3 ) {
				return STATUS.MISSING;
			}

			break;
		case '_n':
			if ( args.length < 4 ) {
				return STATUS.MISSING;
			}

			break;
		case '_nx':
			if ( args.length < 5 ) {
				return STATUS.MISSING;
			}

			break;
		default:
			break;
	}

	const textDomain = getTextDomain( functionName, args );

	if ( ! textDomain ) {
		return STATUS.INVALID_TYPE;
	}

	const { type, value } = textDomain;

	if ( type !== 'Literal' ) {
		return STATUS.INVALID_TYPE;
	}

	if ( ! allowedTextDomains.includes( value ) ) {
		return STATUS.INVALID_VALUE;
	}

	return STATUS.VALID;
}

function getTextDomain( functionName, args ) {
	switch ( functionName ) {
		case '__':
			return args[ 1 ];
		case '_x':
			return args[ 2 ];
		case '_n':
			return args[ 3 ];
		case '_nx':
			return args[ 4 ];
		default:
			return {};
	}
}

const TRANSLATION_FUNCTIONS = [ '__', '_x', '_n', '_nx' ];

module.exports = {
	meta: {
		type: 'problem',
		schema: [
			{
				type: 'object',
				properties: {
					allowDefault: {
						type: 'boolean',
						default: false,
					},
					allowedTextDomains: {
						type: 'array',
						items: {
							type: 'string',
						},
					},
				},
				additionalProperties: false,
			},
		],
	},
	create( context ) {
		const options = context.options[ 0 ] || {};
		const { allowDefault, allowedTextDomains = [] } = options;

		return {
			CallExpression( node ) {
				const { callee, arguments: args } = node;
				if ( ! TRANSLATION_FUNCTIONS.includes( callee.name ) ) {
					return;
				}

				const status = validateTextDomain(
					callee.name,
					args,
					allowedTextDomains
				);

				switch ( status ) {
					case STATUS.MISSING:
						if ( ! allowDefault ) {
							context.report( node, 'Missing text domain' );
						}
						break;
					case STATUS.INVALID_TYPE:
						context.report(
							node,
							'Text domain is not a string literal'
						);
						break;
					case STATUS.INVALID_VALUE:
						const { value } = getTextDomain( callee.name, args );

						if ( 'default' === value && allowDefault ) {
							context.report(
								node,
								'Unnecessary default text domain'
							);
							break;
						}

						context.report( node, 'Invalid text domain: ' + value );
						break;
					default:
						break;
				}
			},
		};
	},
};
