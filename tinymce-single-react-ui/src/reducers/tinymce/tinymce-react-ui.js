import { fromJS } from 'immutable'

// TODO: use redux-actions

const initialState = fromJS({
  focused: false, // does the editor have focus
  bookmark: null, // current bookmark for restoring the selection
  node: null      // current node of the selection (if collapsed) or common ancestor containing the selection)
})

export default (state = initialState, action) => {
  switch (action.type) {
    case 'FOCUS': {
      console.log('>>FOCUS', action)
      return state.merge( {
        focused: true,
        bookmark: action.val[0],
        node: action.val[1]
      } )
  }
    case 'BLUR': {
      console.log('>>BLUR', action)
      return state.merge( {
        focused: false,
        bookmark: action.val[0],
        node: action.val[1]
      } )
  }
    default:
      return state
  }
}