---
number: 4420
type: issue
state: CLOSED
url: https://github.com/WordPress/gutenberg/issues/4420
matched_labels: ["[Package] Components"]
all_labels: ["[Priority] Low","Needs Dev","[Package] Components"]
---

# Issue #4420: RangeControl reset behavior seems wrong

- URL: https://github.com/WordPress/gutenberg/issues/4420
- Author: kmgalanakis
- Created: 2018-01-12T08:34:37Z
- Updated: 2023-06-30T17:00:12Z
- Comments: 18 of 18

## Body

When having a `RangeControl` with `allowReset` set to `true` even though the click of the reset button is resetting the value, the control is not behaving correctly.

![shortcode](https://user-images.githubusercontent.com/1268089/34866031-b389f626-f783-11e7-9e41-3b30c7671fcb.gif)

I can see two possible behaviors. As soon as the user clicks `Reset` the control should either return to its default value, in my case `-1`or it should return to its previously saved value.

Instead, the control remains at the state prior to the reset, even though its actual value is changed.

## Issue comments

### coreymckrill on 2018-08-28T19:46:29Z

URL: https://github.com/WordPress/gutenberg/issues/4420#issuecomment-416716542

I can confirm this behavior. When the Reset button is clicked, the slider handle changes position and the underlying value that is sent to the block preview changes, but the number in the input field does not get updated.

### shazahm1 on 2018-11-28T20:55:53Z

URL: https://github.com/WordPress/gutenberg/issues/4420#issuecomment-442601364

I'm experiencing the same issue. Looking at the code I think I see the issue.

First the `initialPosition` property must be defined and set to the default value you wish to have the control reset to.

This will make the slider update its position. However, the value for number input does not update. It appears that is being set to [`value`](https://github.com/WordPress/gutenberg/blob/master/packages/components/src/range-control/index.js#L65) instead of [`initialSliderValue `](https://github.com/WordPress/gutenberg/blob/master/packages/components/src/range-control/index.js#L41) like it should be.

The slider value updates correctly because it is being set to [`initialSliderValue `](https://github.com/WordPress/gutenberg/blob/master/packages/components/src/range-control/index.js#L41)

### shazahm1 on 2018-11-29T20:57:16Z

URL: https://github.com/WordPress/gutenberg/issues/4420#issuecomment-442990370

Since this is tagged as low priority and I wanted to includes the reset option for a slider used in a block in my plugin, I copied the code and created a custom component to import into the block. I did have to tweak how the dependencies were imported. I also had to make a minor tweak on how the control was being exported, but, with the change mentioned in my last reply, the slider with a reset works quite well. I'm quite happy since my js experience is limited to doing some basic jQuery stuff.

### gregbia on 2019-03-10T08:14:11Z

URL: https://github.com/WordPress/gutenberg/issues/4420#issuecomment-471256979

I can confirm the issue as well in version 5.1. This behavior is weird and should be corrected.

### youknowriad on 2019-04-03T10:00:26Z

URL: https://github.com/WordPress/gutenberg/issues/4420#issuecomment-479423494

cc @jorgefilipecosta

### rebeccaj1211 on 2019-04-09T22:54:37Z

URL: https://github.com/WordPress/gutenberg/issues/4420#issuecomment-481469781

I'm gonna give this a try!

### Soean on 2020-02-24T06:16:10Z

URL: https://github.com/WordPress/gutenberg/issues/4420#issuecomment-590180802

I can't reproduce this issue, also tested in the playground and it works fine. https://wordpress.github.io/gutenberg/?path=/story/components-rangecontrol--with-reset

### shazahm1 on 2020-02-24T19:49:22Z

URL: https://github.com/WordPress/gutenberg/issues/4420#issuecomment-590516493

@Soean 

It seems the doc regarding this control has changed substantially since I last looked:

- https://developer.wordpress.org/block-editor/components/range-control/

There was no documentation or mention of having to `withState`.

Since the usage docs now has an example:

- https://developer.wordpress.org/block-editor/components/range-control/#usage-2

I'll see if I can use it now following those instructions.

This is my custom control which is basically just a copy of the core RangeControl but with a working reset, just for the record ;). Doesn't use `withState` so I'm probably "doing it wrong".

- https://github.com/Connections-Business-Directory/Connections/blob/9.4.5/includes/blocks/components/range-control/index.js

### youknowriad on 2020-02-25T12:58:23Z

URL: https://github.com/WordPress/gutenberg/issues/4420#issuecomment-590853779

Closing as this seems fixed.

### TwisterMc on 2020-05-05T21:47:32Z

URL: https://github.com/WordPress/gutenberg/issues/4420#issuecomment-624324358

I'm still very confused by all of this. Right now I have a `RangeControl` element setup and it's working great. I also have a default setup of `1360`.

**Option 1**
When the user hits **Reset** it passes `undefined` to the `onChange` event. I then check the value and if it's `undefined` it sets it to `1360`.

The issue is if the user decides to delete the numbers before putting in a new number, as soon as all the numbers are deleted, the `onChange` event fires and sets it back to `1360`.

Video: https://cloudup.com/cXB3RIx3iOz

**Option 2**
If I don't check for `undefined` in the `onChange` event then when a user hits the **Reset** button, the numbers don't change even though they were reset. It also throws an error in the console about "A component is changing a controlled input of type number to be uncontrolled." 

Video: https://cloudup.com/csH16pb5aPL

Is there a way to know the user hit the **Reset** button? If so, that'd solve my problem.

Any advice is appreciated.

### youknowriad on 2020-05-06T08:38:12Z

URL: https://github.com/WordPress/gutenberg/issues/4420#issuecomment-624516683

@TwisterMc I can see how the behavior can be confusing. I think this went through several iterations already; @itsjonq might be able to shed some lights here and confirm whether or not we need to improve the behavior.

### TwisterMc on 2020-05-06T13:06:34Z

URL: https://github.com/WordPress/gutenberg/issues/4420#issuecomment-624637505

Is what I'm seeing "correct" then? I feel there are usability issues both ways, but if one is technically correct, then that'd be good to know.

### ItsJonQ on 2020-05-11T11:57:13Z

URL: https://github.com/WordPress/gutenberg/issues/4420#issuecomment-626657158

Hai there 👋 !

@youknowriad + @TwisterMc 

@TwisterMc Thank you for your examples! I had helped refactor this component several months ago. I'll admit, some of the `RangeControl` behaviour is unexpected - especially around the reset/validation mechanics.

I recently submitted a PR to help resolve regressions + add stability:
https://github.com/WordPress/gutenberg/pull/22084

I just pushed an update to address some of the reset confusion:
https://github.com/WordPress/gutenberg/blob/9647605dd77e113e1efe37d120d95c798fcf2fca/packages/components/src/range-control/index.js#L149

However, I don't think it 100% address this issue, or your question re: Option 1 vs Option 2.

Between the 2 options, Option 1 would be the better solution, for now.

Like @kmgalanakis  pointed out in the original description, it should reset to an initial value (avoiding the controlled component -> uncontrolled component swap). The component should manage it by itself, then pass back the results.

Once my [PR](https://github.com/WordPress/gutenberg/pull/22084) gets merged, I'll take a look at this more closely.

Hope this helps!

### ItsJonQ on 2020-05-13T14:36:43Z

URL: https://github.com/WordPress/gutenberg/issues/4420#issuecomment-628032937

Haii! I'm starting to look into this one!

I would love thoughts/confirmation on some scenarios 🙏

(Note: This is NOT how it currently works. However, this is how I'd expect it to work)

#### Controlled: No initial value

```jsx
const [state, setState] = useState()
const handleOnChange = next => setState(next)

<RangeControl allowReset value={state} onChange={handleOnChange} />
```

* Reset cannot be clicked. There's no change.
* Update value to `10` by sliding
* Clicking reset changes value to `''`
* Fires `onChange('')` callback
* Slider visually appears to be centered (50%)

Note: Reason for `''` rather than `null` or `undefined` is because React requires an `input` to have a nullish value of an empty string to be considered "controlled".

#### Controlled: With initial value

```jsx
const [state, setState] = useState(10)
const handleOnChange = next => setState(next)

<RangeControl allowReset value={state} onChange={handleOnChange} />
```

* Reset cannot be clicked. There's no change.
* Update value to `15` by sliding
* Clicking reset changes value to `10`
* Fires `onChange(10)` callback
* Slider visually appears to be at `10` value

#### Controlled: With initial value and `resetFallbackValue`

```jsx
const [state, setState] = useState(10)
const handleOnChange = next => setState(next)

<RangeControl allowReset value={state} onChange={handleOnChange} resetFallbackValue={5} />
```

* Reset cannot be clicked. There's no change.
* Update value to `15` by sliding
* Clicking reset changes value to `5`
* Fires `onChange(5)` callback
* Slider visually appears to be at `5` value

#### Controlled: With initial value + new value (from prop)

```jsx
const [state, setState] = useState(10)
const handleOnChange = next => setState(next)

useEffect(() => {
	setTimeout(() => {
		setState(20)
	}, 100)
}, [])

<RangeControl allowReset value={state} onChange={handleOnChange} />
```

* Reset can be clicked. There's was change.
* Clicking reset changes value to `10`
* Fires `onChange(10)` callback
* Slider visually appears to be at `10` value

---

I lack the context to understand the previous handling with the `resetFallbackValue` prop.

Let me know if I'm on the right track!

Thank you 😊

### youknowriad on 2020-05-14T09:33:21Z

URL: https://github.com/WordPress/gutenberg/issues/4420#issuecomment-628517587

@ItsJonQ Thanks for the details here, I'm not familiar with the existing behavior in Gutenberg but I suspsect that in some use-cases we want the "reset" to mean (reset to  "null"/undefined) I guess this is doable by passing a `resetFallbackValue` as "undefined". So I think the proposal is good.

> Note: Reason for '' rather than null or undefined is because React requires an input to have a nullish value of an empty string to be considered "controlled".

Can we instead call onChange(  undefined ) in this case and do the  magic to use `""` instead of undefined in the component itself?

### ItsJonQ on 2020-05-14T14:29:42Z

URL: https://github.com/WordPress/gutenberg/issues/4420#issuecomment-628673644

> Can we instead call onChange( undefined ) in this case and do the magic to use "" instead of undefined in the component itself?

We could! However, `onChange(undefined)` means the parent component(s) have to interpret and handle the reset value, which was the issue that @TwisterMc raised 🙃 

As part of this, I think it'll be worth looking into the core blocks where RangeControl + reset is used to get a sense of things 👍

### youknowriad on 2020-05-14T14:31:58Z

URL: https://github.com/WordPress/gutenberg/issues/4420#issuecomment-628674990

> We could! However, onChange(undefined) means the parent component(s) have to interpret and handle the reset value, which was the issue that @TwisterMc raised

How is that different than "" though? For me if the parent don't want to interpret the reset value, it should provide one.

### priethor on 2023-06-30T17:00:12Z

URL: https://github.com/WordPress/gutenberg/issues/4420#issuecomment-1614928599

I think this issue is no longer relevant with all the changes in the components, including the range control and how resetting the values work. Please feel free to reopen otherwise 🙏

