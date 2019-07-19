# Repository Management

This is a living document explaining how we collaboratively manage the Gutenberg repository. If you’d like to suggest a change, please open an issue for discussion or submit a pull request to the document.

This document covers:

- [Issues](#issues)
  - [Labels](#labels)
  - [Milestones](#milestones)
  - [Triaging Issues](#triaging-issues)
- [Pull Requests](#pull-requests)
  - [Code Review](#code-review)
  - [Design Review](#design-review)
  - [Merging Pull Requests](#merging-pull-requests)
  - [Closing Pull Requests](#closing-pull-requests)
- [Projects](#projects)

## Issues

A healthy issue list is one where issues are relevant and actionable. *Relevant* in the sense that they relate to the project’s current priorities. *Actionable* in the sense that it’s clear what action(s) need to be taken to resolve the issue.

Any issues that are irrelevant or not actionable should be closed, because they get in the way of making progress on the project. Imagine the issue list as a desk: the more clutter you have on it, the more difficult it is to use the space to get work done.

### Labels

All issues should have [one or more labels](https://github.com/WordPress/gutenberg/labels). 

Workflow labels start with “Needs” and may be applied as needed. Ideally, each workflow label will have a group that follows it, such as the Accessibility Team for `Needs Accessibility Feedback`, the Testing Team for `Needs Testing`, etc.

[Priority High](https://github.com/WordPress/gutenberg/labels/Priority%20High) and [Priority OMGWTFBBQ](https://github.com/WordPress/gutenberg/labels/Priority%20OMGWTFBBQ) issues should have an assignee and/or be in an active milestone.

Help requests or 'how to' questions should be posted in a relevant support forum as a first step. If something might be a bug but it's not clear, the Support Team or a forum volunteer can help troubleshoot the case to help get all the right information needed for an effective bug report.

Here are some labels you might commonly see:

- [Good First Issue](https://github.com/WordPress/gutenberg/labels/Good%20First%20Issue) - Issues identified as good for new contributors to work on. Comment to note that you intend to work on the issue and reference the issue number in the pull request you submit.
- [Good First Review](https://github.com/WordPress/gutenberg/labels/Good%20First%20Review) - Pull requests identified as good for new contributors who are interested in doing code reviews.
- [Needs Accessibility Feedback](https://github.com/WordPress/gutenberg/labels/Accessibility) - Changes that impact accessibility and need corresponding review (e.g. markup changes).
- [Needs Design Feedback](https://github.com/WordPress/gutenberg/labels/Needs%20Design%20Feedback) - Changes that modify the design or user experience in some way and need sign-off.
- [[Type] Bug](https://github.com/WordPress/gutenberg/labels/%5BType%5D%20Bug) - An existing feature is broken in some way.
- [[Type] Enhancement](https://github.com/WordPress/gutenberg/labels/%5BType%5D%20Enhancement) - Gutenberg would be better with this improvement added.
- [[Type] Plugin / Extension Conflict](https://github.com/WordPress/gutenberg/labels/%5BType%5D%20Plugin%20%2F%20Extension%20Conflict) - Documentation of a conflict between Gutenberg and a plugin or extension. The plugin author should be informed and provided documentation on how to address.
- [[Status] Needs More Info](https://github.com/WordPress/gutenberg/labels/%5BStatus%5D%20Needs%20More%20Info) - The issue needs more information in order to be actionable and relevant. Typically this requires follow-up from the original reporter.

[Check out the label directory](https://github.com/WordPress/gutenberg/labels) for a listing of all labels.

### Milestones

We put issues into [milestones](https://github.com/wordpress/gutenberg/milestones) to better categorize them. Issues are added to milestones starting with `WordPress` and pull requests are added to milestones ending in `(Gutenberg)`.

Here are some milestones you might see:

- [WordPress X.Y](https://github.com/WordPress/gutenberg/milestone/70): Tasks that should be done for future WordPress releases.
- [X.Y (Gutenberg)](https://github.com/WordPress/gutenberg/milestone/85): PRs targeted for the Gutenberg Plugin X.Y release.
- [Future](https://github.com/WordPress/gutenberg/milestone/35): this is something that is confirmed by everyone as a good thing but doesn’t fall into other criteria.

### Triaging Issues

To keep the issue list healthy, it needs to be triaged regularly. *Triage* is the practice of reviewing existing issues to make sure they’re relevant, actionable, and have all the information they need.

Anyone can help triage, although you’ll need contributor permission on the Gutenberg repository to modify an issue’s labels or edit its title.

To start simply choose from one of these filtered lists of issues:

- [All Gutenberg issues without an assigned label](https://github.com/wordpress/gutenberg/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-asc+no%3Alabel). Triaging by simply adding labels helps people focused on certain aspects of Gutenberg find relevant issues easier and start working on them.
- [The least recently updated Gutenberg issues](https://github.com/WordPress/gutenberg/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-asc). Triaging issues that are getting old and possibly out of date keeps important work from being overlooked.
- [All Gutenberg issues with no comments](https://github.com/WordPress/gutenberg/issues?q=is%3Aopen+is%3Aissue+sort%3Acomments-asc) Triaging this list helps make sure all issues are acknowledged, and can help identify issues that may need more information or discussion before they are actionable.
- [The least commented on issues](https://github.com/WordPress/gutenberg/issues?q=is%3Aopen+is%3Aissue+sort%3Acomments-asc) Triaging this list helps the community figure out things like traction for certain proposals. 

You can also create your own custom set of filters on GitHub. If you have a filter you think might be useful for the community, feel free to submit a PR to add it to this list.

When triaging, either one of the lists above or issues in general, here are some steps you can perform:

- First search for duplicates. If the issue is duplicate, close it by commenting with “Duplicate of #<original-id>” and add any relevant new details to the existing issue.
- If the issue is missing labels, add some to better categorize it (requires proper permissions).
- If the title doesn’t communicate the issue, edit it for clarity (requires proper permissions).
- If it’s a bug report, test to confirm the report or add the `Needs Testing` label. If there is not enough information to confirm the report, add the `[Status] Needs More Info` label and ask for the details needed.
- Remove the `[Status] Needs More Info` if the author of the issue has responded with enough details.
- Close the issue with a note if it has a `[Status] Needs More Info` label but the author didn't respond in 2+ weeks.
- If there was conversation on the issue but no actionable steps identified, follow up with the participants to see what’s actionable.
- If you feel comfortable triaging the issue further, then you can also:
  - Check that the bug report is valid by debugging it to see if you can track down the technical specifics.
  - Check if the issue is missing some detail and see if you can fill in those details. For instance, if a bug report is missing visual detail, it’s helpful to reproduce the issue locally and upload a screenshot or GIF.

For triaging there are some labels which are very useful:
- `Needs Technical Feedback` - you can apply them when you see new features or API changes proposed
- `Needs More Info` - when it’s not clear what the issue is or it would help to provide additional details
- `Needs Testing` - it’s useful for old bugs where it seems like they are no longer relevant

## Pull Requests

Gutenberg follows a feature branch pull request workflow for all code and documentation changes. At a high-level, the process looks like this:

1. Check out a new feature branch locally.
2. Make your changes, testing thoroughly.
3. Commit your changes when you’re happy with them, and push the branch.
4. Open your pull request.

Along with this process, there are a few important points to mention:

- Non-trivial pull requests should be preceded by a related issue that defines the problem to solve and allows for discussion of the most appropriate solution before actually writing code.
- To make it far easier to merge your code, each pull request should only contain one conceptual change. Keeping contributions atomic keeps the pull request discussion focused on one topic and makes it possible to approve changes on a case-by-case basis.
- Separate pull requests can address different items or todos from their linked issue, there’s no need for a single pull request to cover a single issue if the issue is non-trivial.

### Code Review

Every pull request goes through a manual code review, in addition to automated tests. The objectives for the code review are best thought of as:

- Correct — Does the change do what it’s supposed to?
- Secure — Would a nefarious party find some way to exploit this change?
- Readable — Will your future self be able to understand this change months down the road?
- Elegant — Does the change fit aesthetically within the overall style and architecture?
- Altruistic — How does this change contribute to the greater whole?

*As a reviewer*, your feedback should be focused on the idea, not the person. Seek to understand, be respectful, and focus on constructive dialog.

*As a contributor*, your responsibility is to learn from suggestions and iterate your pull request should it be needed based on feedback. Seek to collaborate and produce the best possible contribution to the greater whole.

### Design Review

If your pull request impacts the design, you should ask for a design review. To request a design review add the [Needs Design Feedback](https://github.com/WordPress/gutenberg/labels/Needs%20Design%20Feedback) label to your PR. As a guide, changes that should be reviewed:

- A change based on a previous design, to confirm the design is still valid with the change.
- Anything that changes something visually.
- If you just want design feedback on an idea or exploration.

### Merging Pull Requests

A pull request can generally be merged once it is:

- Deemed a worthwhile change to the codebase.
- In compliance with all relevant code review criteria.
- Covered by sufficient tests, as necessary.
- Vetted against all potential edge cases.
- Changelog entries were properly added.
- Reviewed by someone other than the original author.
- [Rebased](/docs/contributors/git-workflow.md#keeping-your-branch-up-to-date) onto the latest version of the master branch.

The final pull request merge decision is made by the **@wordpress/gutenberg-core** team.

Please make sure to assign your merged pull request to its release milestone. Doing so creates the historical legacy of what code landed when, and makes it possible for all project contributors (even non-technical ones) to access this information.

### Closing Pull Requests

Sometimes, a pull request may not be mergeable, no matter how much additional effort is applied to it (e.g. out of scope). In these cases, it’s best to communicate with the contributor graciously while describing why the pull request was closed, this encourages productive future involvement.

Make sure to:

1. Thank the contributor for their time and effort.
2. Fully explain the reasoning behind the decision to close the pull request.
3. Link to as much supporting documentation as possible.

If you’d like a template to follow:

> Thanks ____ for the time you’ve spent on this pull request.
>
> I’m closing this pull request because ____. To clarify further, ____.
>
> For more details, please see ____ and ____.

## Teams

Two GitHub teams are used in the project.

* [Gutenberg Core](https://github.com/orgs/WordPress/teams/gutenberg-core): A team composed of people that are actively involved in the project: attending meetings regularly, participating in triage sessions, performing reviews regularly, working on features and bug fixes and performing plugin and npm releases.

* [Gutenberg](https://github.com/orgs/WordPress/teams/gutenberg): A team composed of contributors with at least 2–3 meaningful contributions to the project.

If you meet this criteria of several meaningful contributions having been accepted into the repository and would like to be added to the Gutenberg team, feel free to ask in the [#core-editor Slack channel](https://make.wordpress.org/chat/).

## Projects

We use [GitHub projects](https://github.com/WordPress/gutenberg/projects) to keep track of details that aren't immediately actionable, but that we want to keep around for future reference.

Some key projects include:

* [Phase 2](https://github.com/WordPress/gutenberg/projects/13) - Development tasks needed for Phase 2 of Gutenberg.
* [Phase 2 design](https://github.com/WordPress/gutenberg/projects/21) - Tasks for design in Phase 2. Note: specific projects may have their own boards.
* [Ideas](https://github.com/WordPress/gutenberg/projects/8) - Project containing tickets that, while closed for the time being, can be revisited in the future.
