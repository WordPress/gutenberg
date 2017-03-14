import { fromJS } from 'immutable'

// TODO: use redux-actions

const initialState = fromJS({
  focused: false, // does the editor have focus
  bookmark: null  // current bookmark for restoring the selection
})

export default (state = initialState, action) => {
  switch (action.type) {
    case 'FOCUS': {
      console.log('>>FOCUS', action)
      return state.merge( { focused: true, bookmark: action.val } )
  }
    case 'BLUR': {
      console.log('>>BLUR', action)
      return state.merge( { focused: false, bookmark: action.val } )
  }
    default:
      return state
  }
}