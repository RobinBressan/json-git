# json-git [![Build Status](https://travis-ci.org/RobinBressan/json-git.svg?branch=master)](https://travis-ci.org/RobinBressan/json-git)

A pure JS local Git to versionize any JSON.

If you want to use it with [Redux](https://github.com/reactjs/redux) find the official bindings here: **[json-git-redux](https://github.com/RobinBressan/json-git-redux/)**.

## Why should I use this?

The purpose of **json-git** is not to replace Git.

It is an experiment about bringing Git to the frontend for any Javascript application (like a react application).

## Installation

It is avaible through npm:

```sh
npm install json-git
```

## Usage

### Create a repository

**json-git** exports only one method `createRepository`:

```js
import createRepository from 'json-git';

const repository = createRepository();
```

It's that simple!

### Your first commit

You have now a JSON git, it's time to do your first commit:

```js
const tree = {
    foo: 'bar',
};

repository.commit('robin', 'first commit', tree);
```

`robin` is my author name for that commit, and of course `first commit` is the commit's message.

### Read the current tree

At anytime you can read your current tree by getting the `tree` property :

```js
console.log(repository.tree);
```

This will display:

```json
{
    "foo": "bar",
}
```

### Create your first branch

In **json-git** you always have a `master` branch but you can create some others as many as you want:

```js
repository.checkout('dev', true); // true means the branch is new
```

You can now commit on that branch:

```js
const tree = {
    foo: 'bar',
    hello: 'you',
    bar: true,
};

repository.commit('robin', 'second commit', tree);
```

If you display the tree you will get:

```json
{
    "foo": "bar",
    "hello": "you",
    "bar": true,
}
```

### Change the current branch

Well, we would like to come back to master:

```js
repository.checkout('master');
```

This time, if you display the tree you will get:

```json
{
    "foo": "bar",
}
```

Our `"hello": "world"` is missing because it was commited on `dev` branch not `master`.

*Tip: Use the `branch` property of your repository to know the current branch.*

### Merge a branch into the current branch

#### No conflicts

The better situation for a merge is when there aren't any conflicts. So if we merge our `dev` branch into `master` it should be ok:

```js
repository.merge('robin', 'dev');
```

This will automaticaly create a merge commit with `robin` as author.

#### With conflicts

Forget about our last merge, let's talk about conflicts. First let's commit a new tree on `master`:

```js
const tree = {
    foo: 'lorem',
    hello: 'me',
};

repository.commit('robin', 'an evil commit', tree);
```

We've changed the `foo` value and added an `hello` key too! Let's try to merge `dev` into `master`:

```js
repository.merge('robin', 'dev');
```

Well... it still works. Don't worry it is a normal behaviour. As we are dealing with simple JSON and not a full tree of files and folders, by default json-git will always give priority to the new version .

To review conflicts you must provide a resolver to the merge method:

```js
function resolver(targetPatch /* dev branch */, localPatch /* master branch */, reject) {
    // this resolver will be called on each conflict
    // you receive the two patches which overlap
    // if you do nothing, the targetPatch wins
    // if you call reject, the localPatch wins
}

repository.merge('robin', 'dev', resolver);
```

So if we don't call `reject()`, the tree will look like this:

```json
{
    "foo": "lorem",
    "hello": "you",
    "bar": true,
}
```

But if we call `reject()` to reject the `hello` conflict, the tree will look like this:

```json
{
    "foo": "lorem",
    "hello": "me",
    "bar": true,
}
```

*Tip: a merge won't delete the branch you've just merged. You must use `repository.deleteBranch()` for that.*

### Revert a commit

You can revert at anytime the changes introduced by a commit. It will generate a patch representing the diff between this commit and its parent, and then it will apply and commit it:

```js
repository.revert('robin', '9acf3199dc573910e7f8ed6aaf9ae3d50a174bc9');
```

This will automaticaly create a revert commit with `robin` as author.

As for the merge, the conflict policy is the same (always works until you provide a resolver):

```js
function resolver(patch, localValue, reject) {
    // this resolver will be called on each conflict
    // you receive the patch that json-git want to apply and the current value of the target node
    // if you do nothing, the patch wins
    // if you call reject, the current value wins

    // a conflict on revert can happen for example when the revert want to remove an already removed node.
}

repository.revert('robin', '9acf3199dc573910e7f8ed6aaf9ae3d50a174bc9', resolver);
```

### Getting the full log of the repository

As you've seen, we've been using the commit hash for our `revert()` method. There are two ways to retrieve a commit hash :

* The `commit()` method returns the hash of the new commit
* The `log` property return the full history of your repository indexed by commit hashes

For example if we revert the merge commit, the log could look like this:
```json
{
    "2de9314077d9074bb0ca57cb94e7f455b198db5e": {
        "author": "robin",
        "date": "2017-02-07T11:58:15.592Z",
        "message": "first commit",
        "treeHash": "a5e744d0164540d33b1d7ea616c28f2fa97e754a",
        "parent": "0000000000000000000000000000000000000000",
    },
    "ddfa215a540b0a43e6ae67b0b3893e355b8c06f7":
    {
        "author": "robin",
        "date": "2017-02-07T11:58:15.623Z",
        "message": "second commit",
        "treeHash": "3420a96c38d2a469cf4b029a8a39edd927976d86",
        "parent": "2de9314077d9074bb0ca57cb94e7f455b198db5e"
    },
    "f46b2822b2c7e3f88139789f7c14c83d8a85843a": {
        "author": "robin",
        "date": "2017-02-07T11:58:15.625Z",
        "message": "an evil commit",
        "treeHash": "e81607575aa673052e6cba65d14fee88ae7504ca",
        "parent": "2de9314077d9074bb0ca57cb94e7f455b198db5e"
    },
    "9acf3199dc573910e7f8ed6aaf9ae3d50a174bc9": {
        "author": "robin",
        "date": "2017-02-07T11:58:15.628Z",
        "message": "Merge of dev into master",
        "treeHash": "932b670bb8ccdc53606e51ef5d71ea85748b9d86",
        "parent": "f46b2822b2c7e3f88139789f7c14c83d8a85843a"
    },
    "9f866f45395ce63425113f50165d3b9371e04a8f": {
        "author": "robin",
        "date": "2017-02-07T11:58:15.630Z",
        "message": "Revert of commit 9acf3199dc573910e7f8ed6aaf9ae3d50a174bc9",
        "treeHash": "1c1713b5f507d9b70e50dcff649d5aa4574b6da7",
        "parent": "9acf3199dc573910e7f8ed6aaf9ae3d50a174bc9"
    }
}
```

### Generate a diff

You can generate a diff between two branches or commits by using the `diff()` command:

```js
repository.diff('master', 'dev'); // understand: Give me the patch I need to apply to master if I want to get dev state
```

The output is a JSON Patch, and looks like this:

```json
[
    { "op": "add", "path": "/bar", "value": true },
    { "op": "replace", "path": "/foo", "value": "bar" },
    { "op": "replace", "path": "/hello", "value": "you" }
]
```

### Apply a patch

You can apply a JSON Patch to the current tree by using the `apply()` method:

```js
repository.apply(patch);
```

*Tip: It will return the result but won't make a new commit. If you want to keep the result, it's up to you to commit it.*

If you want to deal with the conflicts that may have occured, it works the same way as the `revert()` method above.

### Delete a branch

When you're done with a branch, you can delete it. It is impossible to delete `master` branch for obvious reasons. The deletion only removes the head pointer, it doesn't remove the commits from the history. We should have a garbage collector for that (in future updates):

```js
repository.deleteBranch('dev');
```

### List of branches

To retrieve the list of branches, use the `branches` property: `console.log(repository.branches)`.

### Save and load your repository

Of course you can always export your repository with its `toJSON()` method in order to save it. Give the json snapshot to `createRepository()` to reload it:

```js
const snapshot = repository.toJSON();
const newRepository = createRepository(snapshot);
```

### Subscription

A repository exposes a `subscribe` and `unsubscribe` methods to be notified when a change occur on the repository:

```js
const subscriber = ({ head }) => console.log(`The new head of the repository is ${head}`);
repository.subscribe(subscriber);

const tree = {
    foo: 'bar',
};

// subscriber will be called with commitHash as head
const commitHash = repository.commit('robin', 'first commit', tree);

// you can unsubscribe at anytime
repository.unsubscribe(subscriber);
```

### API

* `repository.branch` returns the current branch
* `repository.branches` returns the list of branches
* `repository.head` returns the head hash of the current branch
* `repository.log` returns the full history of the repository
* `repository.tree` returns the current tree of the repository
* `repository.apply(patch [, resolver])` applies a patch to the current tree and returns the result
* `repository.commit(author, message, tree)` creates a new commit on the current branch
* `repository.checkout(branch [, create=false])` creates and/or changes the current branch
* `repository.deleteBranch(branch)` removes a branch
* `repository.diff(left, right)` generates a JSON Patch between two branches or commits
* `repository.merge(author, branch [, resolver])` merges a branch into the current branch
* `repository.revert(author, commitHash, [, resolver])` reverts the changes introduced by a commit
* `repository.subscribe(subscriber)` subscribe a subscriber to the repository to be notified at each change
* `repository.toJSON()` exports a snapshot of the repository
* `repository.unsubscribe(subscriber)` unsubscribe a subscriber from the repository
* `createRepository([snapshot])` creates a new repository

## Development

Install dependencies with [yarn](https://yarnpkg.com/). You're then good to go.

To run the tests, just do `npm test`.

## Contribute

All contributions are welcome and must pass the tests. If you add a new feature, please write tests for it.

## License

This application is available under the MIT License.
