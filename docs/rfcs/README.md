# Requests for Comments (RFCs)

To maintain an effective and transparent process for resolving complex technical problems, this project has implemented a Request for Comments (RFC) workflow.

For more information, refer to the blog post:

https://make.wordpress.org/core/2019/04/01/the-block-registration-rfc-and-the-gutenberg-rfc-process/

This process is both inspired and informed by other open source projects such as [React](https://github.com/reactjs/rfcs), [Yarn](https://github.com/yarnpkg/rfcs), and [Rust](https://github.com/rust-lang/rfcs), and of technical bodies standardization processes such as [IETF](https://tools.ietf.org/html/rfc2026), [W3C](https://www.w3.org/2004/02/Process-20040205/tr.html), and [TC39](https://tc39.github.io/process-document/).

## Why have an RFC process?

Overcoming complex technical challenges can be difficult in an open-source project where we are typically unable to meet in person to discuss solutions at depth. The RFC process is intended to provide an open venue for detailed, ongoing discussion and iteration. Further, it serves as a living record of the solution for posterity of future maintainers. The process as outlined below allows both for experimentation and focused discussion, keeping an open feedback loop and adapting to information as it becomes known.

## What types of features or problems should be submitted as RFCs?

While an issue can be sufficient to describe small feature requests, an RFC should be proposed for all features with impact across many areas of the code base, new patterns for extensibility APIs, and technical problems that are hard to solve without making compromises.

## The RFC workflow

The flow to propose a new RFC is the following:

- Create an RFC document for your proposal in Markdown format.
- Submit a pull request to the Gutenberg repository with the Markdown file included in the `docs/rfc` folder ([see examples](/docs/rfcs/)).
- Discussion and feedback should take place in the pull request amongst the original author, Gutenberg Core team members, focus leads, and project contributors.
- As a result of discussion in the pull request and at least one [weekly editor meeting](https://make.wordpress.org/meetings/), the RFC will be accepted (merged) or rejected (closed).

A merged RFC should serve as a sufficient baseline for an initial implementation, and as the de-facto documentation for the feature.

### RFC status

An RFC may be merged as a working document. The status of a document should be noted as a [YAML front matter (metadata)](https://github.blog/2013-09-27-viewing-yaml-metadata-in-your-documents/) in the first lines of the file, as one of the following:

#### `status: Draft`

A "Draft" document is one which has been merged in a state sufficient for initial implementations, but which is expected to need future iterations to refine details or revise specifics which would only become apparent in the course of said implementations. The purpose of allowing for draft documents is to allow for a steady momentum of a feature proposal and to embrace quality via experimentation.

Any document with a "Draft" status should be added as a column to the [Request for Comments (RFC) project](https://github.com/WordPress/gutenberg/projects/26) to serve as a reference for those interested to follow along with its progress.

A "Draft" document should always be kept in sync with the current direction of implementations using it as a base. Proposed changes to the RFC document should be assigned to the Project column.

#### `status: Standard`

Once an RFC document is considered to be finalized, its status should be migrated to "Standard".

A document is final once its feature implementation is complete, and upon approval by focus leads.

## What makes a good RFC document?

A good RFC document can be broken into the following sections:

- Description of the problems solved by the RFC
- Current status and previous attempts
- Solution Proposal
- Unsolved Problems

For reference, [view current Gutenberg RFCs](/docs/rfcs/).

## Who can submit an RFC?

Anyone can submit an RFC.
