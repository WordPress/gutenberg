const defaultState = {
	promises: {},
};

		case 'SETUP_PROMISE': {
			return {
				...state,
				promises: {
					...state.promises,
					[ action.queue ]: {
						...( state.promises[ action.queue ] || {} ),
						[ action.context ]: {
							promise: action.promise,
							resolve: action.resolve,
							reject: action.reject,
						},
					},
				},
			};
		}

				promises: {
					...state.promises,
					[ action.queue ]: omit(
						state.promises[ action.queue ] || {},
						[ action.context ]
					),
				},
