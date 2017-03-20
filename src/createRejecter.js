// @flow
export default function createRejecter() {
    let rejected: boolean = false;

    return {
        // $FlowIssue - get/set properties not yet supported
        get rejected() {
            return rejected;
        },

        reject(): void {
            rejected = true;
        },
    };
}
