import { fromJS } from 'immutable'

// TODO: use redux-actions

const initialState = fromJS({
  focused: false, // does the editor have focus
  bookmark: null, // current bookmark for restoring the selection
  node: null      // current node of the selection (if collapsed) or common ancestor containing the selection)
})

export default (state = initialState, action) => {
  console.log('>>action:'+action.type, action)
  switch (action.type) {
    case 'FOCUS': { // action.val: [bookmark, node]
      return state.merge( {
        focused: true,
        bookmark: action.val[0],
        node: action.val[1]
      } )
    }
    case 'BLUR': { // action.val: [bookmark, node]
      return state.merge( {
        focused: false,
        bookmark: action.val[0],
        node: action.val[1]
      } )
    }
    case 'NODECHANGE': { // action.val: [bookmark, node]
      // if (action.val[1] !== action.val[2].element)
      //   console.log('!! '+action.type, action.val[1], action.val[2].element, action)
      // else
      //   console.log('OK '+action.type, action.val[1], action.val[2].element, action)
      return state.merge( {
        bookmark: action.val[0],
        node: action.val[1]
      } )
    }
    default:
      console.log('!!UNHANDLED ACTION', action)
      return state
  }
}