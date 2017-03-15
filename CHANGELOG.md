# Changelog

## 15/03/2017

v0.2.0 - Add subscription API

The git format has changed, you can migrate old snapshots by running this:

```js
function migrateOldSnapshot(snapshot) {
    return {
        refs: {
            branch: {
                value: snapshot.refs.branch,
            },
            heads: snapshot.refs.heads,
        },
        commits: snapshot.stores.commit,
        trees: snapshot.stores.tree,
    };
}
```
