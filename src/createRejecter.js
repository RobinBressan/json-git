export default function createRejecter() {
    let rejected = false;

    return {
        get rejected() {
            return rejected;
        },

        reject() {
            rejected = true;
        },
    };
}
